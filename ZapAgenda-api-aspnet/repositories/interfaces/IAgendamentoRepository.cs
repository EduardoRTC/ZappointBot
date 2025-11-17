using FluentResults;
using ZapAgenda_api_aspnet.Dtos.Agendamento;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.repositories.interfaces
{
    public interface IAgendamentoRepository
    {
        Task<Result<Agendamento>> CreateAsync(CreateAgendamentoDto createAgendamentoDto, Guid IdEmpresa);
        Task<Result<Agendamento>> GetById(int IdAgendamento, Guid IdEmpresa);
        Task<Result<List<AgendamentoDto>>> GetAllByEmpresa(Guid IdEmpresa, int? IdUsuario);
        Task<Result<Agendamento>> UpdateAsync(UpdateAgendamentoDto updateAgendamentoDto, int IdAgendamento, Guid IdEmpresa);
    }
}