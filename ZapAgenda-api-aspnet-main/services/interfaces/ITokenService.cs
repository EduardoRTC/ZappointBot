using ZapAgenda_api_aspnet.Dtos.Usuario;

namespace ZapAgenda_api_aspnet.services.interfaces
{
    public interface ITokenService
    {
        string CreateToken(UsuarioDto usuario);
    }
}