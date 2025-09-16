using FluentResults;
using Microsoft.EntityFrameworkCore;
using System.Linq;
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
        private readonly IClienteRepository _clienteRepo;
        private readonly IUsuarioRepository _usuarioRepo;
        public AgendamentoRepository(CoreDBContext context, IClienteRepository clienteRepo, IUsuarioRepository usuarioRepo)
        {
            _context = context;
            _clienteRepo = clienteRepo;
            _usuarioRepo = usuarioRepo;
        }

        public async Task<Result<List<AgendamentoDto>>> GetAllAsync()
        {
            var agendamentos = await _context.Agendamento
                .Include(a => a.Cliente)
                .Include(a => a.Usuario)
                .Select(agendamento => agendamento.ToAgendamentoDto())
                .ToListAsync();

            return Result.Ok(agendamentos);
        }

        public async Task<Result<Agendamento>> GetByIdAsync(int IdAgendamento)
        {
            var agendamento = await _context.Agendamento
                .Include(a => a.Cliente)
                .Include(a => a.Usuario)
                .FirstOrDefaultAsync(a => a.Id == IdAgendamento);

            if (agendamento == null)
            {
                return Result.Fail($"Não existe agendamento de id:{IdAgendamento}");
            }

            return Result.Ok(agendamento);
        }

        public async Task<Result<Agendamento>> CreateAsync(CreateAgendamentoDto createAgendamentoDto)
        {
            var agendamento = createAgendamentoDto.ToCreateAgendamentoDto();

            var cliente = await _clienteRepo.GetByIdAsync(createAgendamentoDto.IdCliente);
            if (cliente.IsFailed)
            {
                return Result.Fail(cliente.Errors);
            }

            var usuario = await _usuarioRepo.GetByIdAsync(createAgendamentoDto.IdUsuario);
            if (usuario.IsFailed)
            {
                return Result.Fail(usuario.Errors);
            }

            var servicos = await _context.Servico
                .Where(s => createAgendamentoDto.IdServico.Contains((int)s.Id))
                .ToListAsync();

            if (servicos.Count == 0)
            {
                return Result.Fail("Não existe os serviços listados");
            }

            var valorTotal = servicos.Sum(s => s.Valor);
            var tempoDuracao = servicos.Sum(s => s.TempoDuracao.TotalMinutes);

            agendamento.DataHoraFim = createAgendamentoDto.DataHoraInicio.Add(TimeSpan.FromMinutes(tempoDuracao));
            agendamento.ValorTotal = valorTotal;
            agendamento.TempoDuracaoAgendamento = TimeSpan.FromMinutes(tempoDuracao);

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

        public async Task<Result<Agendamento>> UpdateAsync(UpdateAgendamentoDto updateAgendamentoDto, int IdAgendamento)
        {
            var agendamento = await _context.Agendamento.FirstOrDefaultAsync(a => a.Id == IdAgendamento);
            if (agendamento == null)
            {
                return Result.Fail($"Não existe agendamento de id:{IdAgendamento}");
            }

            var cliente = await _clienteRepo.GetByIdAsync(updateAgendamentoDto.IdCliente);
            if (cliente.IsFailed)
            {
                return Result.Fail(cliente.Errors);
            }

            var usuario = await _usuarioRepo.GetByIdAsync(updateAgendamentoDto.IdUsuario);
            if (usuario.IsFailed)
            {
                return Result.Fail(usuario.Errors);
            }

            agendamento.IdCliente = updateAgendamentoDto.IdCliente;
            agendamento.IdUsuario = updateAgendamentoDto.IdUsuario;
            agendamento.Observacao = updateAgendamentoDto.Observacao;
            agendamento.StatusAgendamento = updateAgendamentoDto.StatusAgendamento;
            agendamento.ValorTotal = updateAgendamentoDto.ValorTotal;
            agendamento.DataHoraInicio = updateAgendamentoDto.DataHoraInicio;
            agendamento.DataHoraFim = updateAgendamentoDto.DataHoraFim;
            agendamento.TempoDuracaoAgendamento = updateAgendamentoDto.DataHoraFim - updateAgendamentoDto.DataHoraInicio;

            var agendamentosServicosRemover = await _context.AgendamentoServico.Where(x => x.IdAgendamento == IdAgendamento).ToListAsync();

            _context.AgendamentoServico.RemoveRange(agendamentosServicosRemover);

            var agendamentosServicosAdicionar = updateAgendamentoDto.IdServico.Select(idServico => new AgendamentoServico
            {
                IdAgendamento = IdAgendamento,
                IdServico = idServico
            }).ToList();

            await _context.AgendamentoServico.AddRangeAsync(agendamentosServicosAdicionar);
            await _context.SaveChangesAsync();
            return Result.Ok(agendamento);
        }
    }
}