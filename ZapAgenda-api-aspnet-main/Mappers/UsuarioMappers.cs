using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.Mappers
{
    public static class UsuarioMappers
    {
        public static Usuario ToCreateUsuarioDto(this CreateUsuarioDto createUsuarioDto)
        {
            return new Usuario
            {
                NomeInteiro = createUsuarioDto.NomeInteiro,
                Senha = createUsuarioDto.Senha,
                Email = createUsuarioDto.Email,
                NomeUsuario = createUsuarioDto.NomeUsuario,
                IdCargo = createUsuarioDto.IdCargo,
                Cpf = createUsuarioDto.Cpf
            };
        }
        public static UsuarioDto ToUsuarioDto(this Usuario usuarioModel)
        {
            return new UsuarioDto
            {
                IdUsuario = usuarioModel.Id,
                NomeInteiro = usuarioModel.NomeInteiro,
                Email = usuarioModel.Email,
                NomeUsuario = usuarioModel.NomeUsuario,
                IdCargo = usuarioModel.IdCargo,
                IdEmpresa = usuarioModel.IdEmpresa,
                Cpf = usuarioModel.Cpf
            };
        }
        public static Usuario ToUpdateUsarioDto(this Usuario updateUsuarioDto, Guid IdEmpresa)
        {
            return new Usuario
            {
                NomeInteiro = updateUsuarioDto.NomeInteiro,
                Email = updateUsuarioDto.Email,
                IdEmpresa = IdEmpresa,
                NomeUsuario = updateUsuarioDto.NomeUsuario,
                IdCargo = updateUsuarioDto.IdCargo,
                Cpf = updateUsuarioDto.Cpf
            };
        }

        public static UsuarioComSenhaDto ToUsuarioComSenhaDto(this Usuario usuario)
        {
            return new UsuarioComSenhaDto
            {
                IdCargo = usuario.IdCargo,
                NomeUsuario = usuario.NomeUsuario,
                Senha = usuario.Senha,
                Cpf = usuario.Cpf,
                NomeInteiro = usuario.NomeInteiro,
                Email = usuario.Email,
                IdUsuario = usuario.Id
            };
        }

        public static NomeUsuarioDto ToNomeUsuarioDto(this Usuario usuario)
        {
            return new NomeUsuarioDto
            {
                IdUsuario = usuario.Id,
                NomeUsuario = usuario.NomeUsuario
            };
        }
    }
}