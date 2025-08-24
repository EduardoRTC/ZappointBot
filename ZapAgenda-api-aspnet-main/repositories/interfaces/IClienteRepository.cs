using FluentResults;
using ZapAgenda_api_aspnet.Dtos.Cliente;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.generic;

namespace ZapAgenda_api_aspnet.repositories.interfaces
{
    public interface IClienteRepository : IRepository<Cliente>
    {
        Task<Result<Cliente>> CreateAsync(Cliente cliente, Guid IdEmpresa);
        Task<List<ClienteDto>>? GetAllPorEmpresaAsync(Guid IdEmpresa);
        Task<Result<Cliente>> GetById(int IdCliente, Guid Idempresa);
        Task<Result<Cliente>> UpdateAsync(UpdateClienteDto updateClienteDto, int IdCliente, Guid IdEmpresa);
    }
}