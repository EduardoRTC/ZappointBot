using FluentResults;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.generic;

namespace ZapAgenda_api_aspnet.repositories.interfaces
{
    public interface IUsuarioRepository : IRepository<Usuario>
    {
        Task<Result<Usuario>> CreateAsync(Usuario usuarioModel);
        Task<Result<List<UsuarioDto>>> GetAllAsyncDetailed();
        Task<Result<UsuarioComSenhaDto>> GetByNomeUsuarioAsync(string nomeUsuario);
        Task<Result<Usuario>> UpdateAsync(UpdateUsuarioDto updateUsuarioDto, int idUsuario);
        Task<Result<Usuario>> UpdateSenhaAsync(UpdateSenhaUsuarioDto updateSenhaUsuarioDto, int idUsuario);
        Task<Result<List<NomeUsuarioDto>>> GetNomeUsuarioDto();
    }
}