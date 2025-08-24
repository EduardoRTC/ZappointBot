using FluentResults;
using ZapAgenda_api_aspnet.Dtos.Servico;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.repositories.interfaces
{
    public interface IServicoRepository
    {
        Task<Result<Servico>> GetById(int IdServico, Guid IdEmpresa);
        Task<Result<List<Servico>>> GetAllByEmpresa(Guid IdEmpresa);
        Task<Result<Servico>> CreateAsync(Servico servico, Guid IdEmpresa);
        Task<Result<Servico>> UpdateAsync(UpdateServicoDto updateServicoDto, int IdServico, Guid IdEmpresa);
    }
}