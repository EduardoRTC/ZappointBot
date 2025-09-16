using FluentResults;
using ZapAgenda_api_aspnet.Dtos.Agendamento;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.repositories.interfaces
{
    public interface IAgendamentoRepository
    {
        Task<Result<Agendamento>> CreateAsync(CreateAgendamentoDto createAgendamentoDto);
        Task<Result<Agendamento>> GetByIdAsync(int IdAgendamento);
        Task<Result<List<AgendamentoDto>>> GetAllAsync();
        Task<Result<Agendamento>> UpdateAsync(UpdateAgendamentoDto updateAgendamentoDto, int IdAgendamento);
    }
}