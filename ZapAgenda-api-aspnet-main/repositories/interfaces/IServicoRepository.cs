using FluentResults;
using ZapAgenda_api_aspnet.Dtos.Servico;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.repositories.interfaces
{
    public interface IServicoRepository
    {
        Task<Result<Servico>> GetByIdAsync(int IdServico);
        Task<Result<List<Servico>>> GetAllAsync();
        Task<Result<Servico>> CreateAsync(Servico servico);
        Task<Result<Servico>> UpdateAsync(UpdateServicoDto updateServicoDto, int IdServico);
    }
}