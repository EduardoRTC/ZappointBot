using FluentResults;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.generic;

namespace ZapAgenda_api_aspnet.repositories.interfaces
{
    public interface IUsuarioRepository : IRepository<Usuario>
    {
        Task<Result<Usuario>> CreateAsync(Usuario usuarioModel, Guid IdEmpresa);
        Task<Result<List<UsuarioDto>>> GetUsuariosByEmpresa(Guid IdEmpresa);
        Task<Result<UsuarioComSenhaDto>> GetUsariosByEmpresaAndNomeUsuario(Guid IdEmpresa, string nomeUsuario);
        Task<Result<Usuario>> UpdateAsync(UpdateUsuarioDto updateUsuarioDto, int idUsuario, Guid IdEmpresa);
        Task<Result<Usuario>> UpdateSenhaAsync(UpdateSenhaUsuarioDto updateSenhaUsuarioDto, int idUsuario, Guid IdEmpresa);
        Task<Result<Usuario>> GetByIdAsync (int idUsuario,Guid IdEmpresa);
        Task<Result<List<NomeUsuarioDto>>> GetNomeUsuarioDto (Guid IdEmpresa);
    }
}