using FluentResults;
using Microsoft.EntityFrameworkCore;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.Dtos.Agendamento;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.repositories.implementations
{
    public class AgendamentoRepository : IAgendamentoRepository
    {
        private readonly CoreDBContext _context;
        private readonly IEmpresaRepository _empresaRepo;
        private readonly IClienteRepository _clienteRepo;
        private readonly IUsuarioRepository _usuarioRepo;
        public AgendamentoRepository(CoreDBContext context, IEmpresaRepository empresaRepo, IClienteRepository clienteRepo, IUsuarioRepository usuarioRepo)
        {
            _context = context;
            _empresaRepo = empresaRepo;
            _clienteRepo = clienteRepo;
            _usuarioRepo = usuarioRepo;
        }

        public async Task<Result<List<AgendamentoDto>>> GetAllByEmpresa(Guid IdEmpresa)
        {
            var empresa = await _empresaRepo.GetById(IdEmpresa);
            if (empresa.IsFailed)
            {
                return Result.Fail($"Não existe empresa de id{IdEmpresa}");
            }
            return Result.Ok(await _context.Agendamento.Include(a => a.Cliente).Include(a => a.Usuario).Where(agen => agen.IdEmpresa == IdEmpresa).Select(agendamento => agendamento.ToAgendamentoDto()).ToListAsync());
        }

        public async Task<Result<Agendamento>> GetById(int IdAgendamento, Guid IdEmpresa)
        {
            var agendamento = await _context.Agendamento.FindAsync(IdAgendamento);
            if (agendamento == null)
            {
                return Result.Fail($"Não existe agendamento de id:{IdAgendamento}");
            }
            if (agendamento.IdEmpresa != IdEmpresa)
            {
                return Result.Fail($"Agendamento não pertence a empresa");
            }
            return Result.Ok(agendamento);
        }
        //todo: Fazer validação de UTC
        public async Task<Result<Agendamento>> CreateAsync(CreateAgendamentoDto createAgendamentoDto, Guid IdEmpresa)
        {
            var agendamento = createAgendamentoDto.ToCreateAgendamentoDto();
            var cliente = await _clienteRepo.GetById(createAgendamentoDto.IdCliente, IdEmpresa);

            if (cliente.IsFailed)
            {
                return Result.Fail(cliente.Errors);
            }

            var usuario = await _usuarioRepo.GetByIdAsync(createAgendamentoDto.IdUsuario, IdEmpresa);
            if (usuario.IsFailed)
            {
                return Result.Fail(usuario.Errors);
            }

            //Está pegando todos serviços arrumar isso
            var servicos = await _context.Servico
                .ToListAsync();

            servicos = servicos
                        .Where(s => createAgendamentoDto.IdServico.Contains((int)s.Id))
                        .ToList();

            /*
                Ver um jeito de fazer parecido com isso aqui, está puxando todos serviços para post burro pra caramba

                var servicos = await _context.Servico
                .Where(s => createAgendamentoDto.IdServico.Contains((int)s.IdServico))
                .ToListAsync();
             */

            if (servicos.Count == 0)
            {
                return Result.Fail("Não existe os serviços listados");
            }

            var valorTotal = servicos.Sum(s => s.Valor);
            var TempoDuracao = servicos.Sum(s => s.TempoDuracao.TotalMinutes);

            agendamento.IdEmpresa = IdEmpresa;

            agendamento.DataHoraFim = createAgendamentoDto.DataHoraInicio.Add(TimeSpan.FromMinutes(TempoDuracao));
            agendamento.ValorTotal = valorTotal;
            agendamento.TempoDuracaoAgendamento = TimeSpan.FromMinutes(TempoDuracao); // Ver possível problema se o agendamento for muito grande tipo mais de um dia
            await _context.Agendamento.AddAsync(agendamento);
            await _context.SaveChangesAsync();

            var agendamentoServicos = createAgendamentoDto.IdServico.Select(idServico => new AgendamentoServico
            {
                IdAgendamento = agendamento.Id,
                IdServico = idServico,
            }).ToList();

            await _context.AgendamentoServico.AddRangeAsync(agendamentoServicos);
            await _context.SaveChangesAsync();
            return Result.Ok(agendamento);
        }

        //todo: Adiciona validações está cru
        public async Task<Result<Agendamento>> UpdateAsync(UpdateAgendamentoDto updateAgendamentoDto, int IdAgendamento, Guid IdEmpresa)
        {
            var agendamento = await GetById(IdAgendamento, IdEmpresa);
            if (agendamento.IsFailed)
            {
                return Result.Fail(agendamento.Errors);
            }

            var cliente = await _clienteRepo.GetById(updateAgendamentoDto.IdCliente, IdEmpresa);
            if (cliente.IsFailed)
            {
                return Result.Fail(cliente.Errors);
            }

            var usuario = await _usuarioRepo.GetByIdAsync(updateAgendamentoDto.IdUsuario, IdEmpresa);

            if (usuario.IsFailed)
            {
                return Result.Fail(usuario.Errors);
            }

            var agendamentoValor = agendamento.Value;
            agendamentoValor.IdCliente = updateAgendamentoDto.IdCliente;
            agendamentoValor.IdUsuario = updateAgendamentoDto.IdUsuario;
            agendamentoValor.Observacao = updateAgendamentoDto.Observacao;
            agendamentoValor.StatusAgendamento = updateAgendamentoDto.StatusAgendamento;
            agendamentoValor.ValorTotal = updateAgendamentoDto.ValorTotal;
            agendamentoValor.DataHoraInicio = updateAgendamentoDto.DataHoraInicio;
            agendamentoValor.DataHoraFim = updateAgendamentoDto.DataHoraFim;
            agendamentoValor.TempoDuracaoAgendamento = updateAgendamentoDto.DataHoraFim - updateAgendamentoDto.DataHoraInicio;


            var agendamentosServicosRemover = await _context.AgendamentoServico.Where(x => x.IdAgendamento == IdAgendamento).ToListAsync();

            _context.AgendamentoServico.RemoveRange(agendamentosServicosRemover);

            var agendamentosServicosAdicionar = updateAgendamentoDto.IdServico.Select(idServico => new AgendamentoServico
            {
                IdAgendamento = IdAgendamento,
                IdServico = idServico
            }).ToList();

            await _context.AgendamentoServico.AddRangeAsync(agendamentosServicosAdicionar);
            await _context.SaveChangesAsync();
            return Result.Ok(agendamentoValor);
        }
    }
}