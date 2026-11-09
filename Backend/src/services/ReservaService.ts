/**
 * ReservaService
 * --------------
 * Responsável pela criação e gerenciamento de reservas (compra de
 * passagens).
 *
 * REGRAS DE NEGÓCIO PRINCIPAIS:
 * - Usuário PADRAO só pode reservar assentos ECONOMICO.
 * - Usuário VIP/ADMIN pode reservar ECONOMICO ou VIP.
 * - Todo usuário recebe automaticamente o melhor desconto ativo
 *   elegível para o seu perfil e o tipo de voo (via DescontoService),
 *   sem precisar de nenhuma ação manual. Descontos GERAL valem para
 *   qualquer usuário; descontos VIP, apenas para quem possui
 *   benefícios VIP. Os descontos não se acumulam.
 * - Não é possível reservar um assento já ocupado, nem em um voo cujo
 *   status indique indisponibilidade (ESGOTADA, ATRASADA, CANCELADA,
 *   REALIZADO) ou cuja dataHora já tenha passado.
 * - A reserva nasce com status PENDENTE_PAGAMENTO (o pagamento
 *   simbólico é responsabilidade do PagamentoService).
 *
 * Este service depende de ReservaRepository, VooRepository,
 * DescontoService e NotificacaoService, mas nunca acessa o TypeORM
 * diretamente.
 */

import { ReservaRepository } from "../repositories/ReservaRepository";
import { VooRepository } from "../repositories/VooRepository";
import { DescontoService } from "./DescontoService";
import { Reserva } from "../models/Reserva";
import { Usuario } from "../models/Usuario";
import { ClasseAssento } from "../enums/ClasseAssento";
import { StatusReserva } from "../enums/StatusReserva";
import { TipoVoo } from "../enums/TipoVoo";

/** Número máximo de assentos por compra (regra de negócio). */
const MAX_ASSENTOS_POR_COMPRA = 4;

/** Formato de cada passageiro enviado pelo frontend na compra múltipla. */
export interface PassageiroDaCompra {
  assentoId: string;
  cpf: string;
}

export class ReservaService {
  private reservaRepository: ReservaRepository;
  private vooRepository: VooRepository;
  private descontoService: DescontoService;

  constructor() {
    this.reservaRepository = new ReservaRepository();
    this.vooRepository = new VooRepository();
    this.descontoService = new DescontoService();
  }

  /**
   * Cria uma nova reserva para um usuário, em um voo e assento
   * específicos. Calcula o valor final já aplicando o melhor
   * desconto automático elegível para o usuário (GERAL ou VIP).
   */
  public async criarReserva(
    usuario: Usuario,
    vooId: string,
    assentoId: string
  ): Promise<Reserva> {
    const voo = await this.vooRepository.buscarPorId(vooId);
    if (!voo) {
      throw new Error("Voo não encontrado.");
    }

    if (voo.estaIndisponivelParaCompra()) {
      throw new Error(
        `Não é possível reservar: o voo está com status ${voo.status}.`
      );
    }

    // Checagem direta de data, complementar à verificação de status
    // acima: o status REALIZADO só é recalculado e persistido quando
    // o voo é consultado via VooService (buscarPorId/listarTodos). Como
    // este método busca o voo diretamente pelo VooRepository, o status
    // salvo no banco pode estar desatualizado se ninguém consultou esse
    // voo desde que a data/horário passou. Esta checagem garante que,
    // de qualquer forma, não é possível reservar um voo cuja dataHora
    // já passou.
    if (new Date(voo.dataHora).getTime() <= Date.now()) {
      throw new Error("Não é possível reservar: este voo já ocorreu.");
    }

    const assento = voo.assentos.find((a) => a.id === assentoId);
    if (!assento) {
      throw new Error("Assento não encontrado neste voo.");
    }

    if (!assento.disponivel) {
      throw new Error("Este assento já está ocupado.");
    }

    // REGRA: usuário PADRAO só pode reservar assento ECONOMICO.
    // possuiBeneficiosVIP() é um método polimórfico de Usuario: aqui
    // não precisamos de "instanceof UsuarioPadrao" - cada subclasse já
    // sabe responder se tem ou não direito a assento VIP.
    if (assento.classe === ClasseAssento.VIP && !usuario.possuiBeneficiosVIP()) {
      throw new Error(
        "Usuários padrão não podem reservar assentos da classe VIP. Considere fazer upgrade para VIP."
      );
    }

    // Marca o assento como ocupado (encapsulamento: o próprio Assento
    // controla essa transição via método reservar()).
    assento.reservar();
    await this.vooRepository.salvar(voo);

    const valorFinal = await this.calcularValorFinal(usuario, voo.precoBase, voo.tipoVoo);

    const reserva = new Reserva();
    reserva.usuario = usuario;
    reserva.voo = voo;
    reserva.assento = assento;
    reserva.valorFinal = valorFinal;
    reserva.status = StatusReserva.PENDENTE_PAGAMENTO;

    return this.reservaRepository.salvar(reserva);
  }

  /**
   * Cria múltiplas reservas em uma única compra (até MAX_ASSENTOS_POR_COMPRA).
   * Cada passageiro tem seu próprio assento e CPF. Todas as reservas são
   * para o mesmo voo e o mesmo usuário comprador.
   *
   * Garante atomicidade parcial: valida TODOS os assentos antes de
   * marcar qualquer um como ocupado — se algum assento for inválido,
   * nenhuma reserva é criada.
   */
  public async criarReservas(
    usuario: Usuario,
    vooId: string,
    passageiros: PassageiroDaCompra[]
  ): Promise<Reserva[]> {
    if (!passageiros || passageiros.length === 0) {
      throw new Error("Informe ao menos um assento para reservar.");
    }

    if (passageiros.length > MAX_ASSENTOS_POR_COMPRA) {
      throw new Error(
        `É possível reservar no máximo ${MAX_ASSENTOS_POR_COMPRA} assentos por compra.`
      );
    }

    // Valida CPFs: aceita com ou sem formatação (###.###.###-##)
    const cpfRegex = /^\d{11}$/;
    for (const p of passageiros) {
      const cpfLimpo = p.cpf.replace(/\D/g, "");
      if (!cpfRegex.test(cpfLimpo)) {
        throw new Error(`CPF inválido: "${p.cpf}". Informe 11 dígitos numéricos.`);
      }
    }

    // Verifica assentos duplicados na mesma compra
    const idsAssentos = passageiros.map((p) => p.assentoId);
    if (new Set(idsAssentos).size !== idsAssentos.length) {
      throw new Error("Não é possível reservar o mesmo assento duas vezes na mesma compra.");
    }

    const voo = await this.vooRepository.buscarPorId(vooId);
    if (!voo) throw new Error("Voo não encontrado.");

    if (voo.estaIndisponivelParaCompra()) {
      throw new Error(`Não é possível reservar: o voo está com status ${voo.status}.`);
    }

    if (new Date(voo.dataHora).getTime() <= Date.now()) {
      throw new Error("Não é possível reservar: este voo já ocorreu.");
    }

    // --- Fase 1: validar TODOS os assentos antes de alterar qualquer estado ---
    const assentosParaReservar = passageiros.map((p) => {
      const assento = voo.assentos.find((a) => a.id === p.assentoId);
      if (!assento) throw new Error(`Assento não encontrado neste voo.`);
      if (!assento.disponivel) throw new Error(`O assento ${assento.numero} já está ocupado.`);
      if (assento.classe === ClasseAssento.VIP && !usuario.possuiBeneficiosVIP()) {
        throw new Error(
          `O assento ${assento.numero} é VIP. Usuários padrão não podem reservar assentos VIP.`
        );
      }
      return { assento, cpf: p.cpf.replace(/\D/g, "") };
    });

    // --- Fase 2: marcar todos os assentos e salvar o voo de uma vez ---
    for (const { assento } of assentosParaReservar) {
      assento.reservar();
    }
    await this.vooRepository.salvar(voo);

    // --- Fase 3: criar e salvar cada reserva ---
    const valorFinal = await this.calcularValorFinal(usuario, voo.precoBase, voo.tipoVoo);

    const reservasSalvas: Reserva[] = [];
    for (const { assento, cpf } of assentosParaReservar) {
      const reserva = new Reserva();
      reserva.usuario = usuario;
      reserva.voo = voo;
      reserva.assento = assento;
      reserva.cpfPassageiro = cpf;
      reserva.valorFinal = valorFinal;
      reserva.status = StatusReserva.PENDENTE_PAGAMENTO;
      reservasSalvas.push(await this.reservaRepository.salvar(reserva));
    }

    return reservasSalvas;
  }

  /**
   * Calcula o valor final da passagem, aplicando o melhor desconto
   * automático elegível para o usuário (GERAL sempre é elegível; VIP
   * apenas para quem possui benefícios VIP) e o tipo do voo (NACIONAL
   * ou INTERNACIONAL). Os descontos não se acumulam - DescontoService
   * já resolve qual é o melhor entre os elegíveis.
   */
  private async calcularValorFinal(
    usuario: Usuario,
    precoBase: number,
    tipoVoo: TipoVoo
  ): Promise<number> {
    const desconto = await this.descontoService.buscarMelhorDesconto(
      tipoVoo,
      usuario.possuiBeneficiosVIP()
    );

    if (!desconto) {
      return precoBase;
    }

    return desconto.aplicarDesconto(precoBase);
  }

  /** Busca uma reserva pelo id. */
  public async buscarPorId(id: string): Promise<Reserva | null> {
    return this.reservaRepository.buscarPorId(id);
  }

  /** Lista todas as reservas de um usuário ("Minhas Reservas"). */
  public async listarPorUsuario(usuarioId: string): Promise<Reserva[]> {
    return this.reservaRepository.listarPorUsuario(usuarioId);
  }

  /** Lista todas as reservas do sistema (usado para relatórios do ADM). */
  public async listarTodas(): Promise<Reserva[]> {
    return this.reservaRepository.listarTodas();
  }

  /**
   * Cancela uma reserva. Só o próprio usuário que fez a reserva (ou
   * um Admin) pode cancelá-la. Ao cancelar, o assento volta a ficar
   * disponível para outros usuários.
   */
  public async cancelarReserva(solicitante: Usuario, reservaId: string): Promise<Reserva> {
    const reserva = await this.reservaRepository.buscarPorId(reservaId);
    if (!reserva) {
      throw new Error("Reserva não encontrada.");
    }

    const ehDonoDaReserva = reserva.usuario.id === solicitante.id;
    if (!ehDonoDaReserva && !solicitante.isAdmin()) {
      throw new Error("Você não tem permissão para cancelar esta reserva.");
    }

    reserva.cancelar();

    // Libera o assento para que outro usuário possa reservá-lo.
    const voo = await this.vooRepository.buscarPorId(reserva.voo.id);
    if (voo) {
      const assento = voo.assentos.find((a) => a.id === reserva.assento.id);
      if (assento) {
        assento.liberar();
        await this.vooRepository.salvar(voo);
      }
    }

    return this.reservaRepository.salvar(reserva);
  }
}
