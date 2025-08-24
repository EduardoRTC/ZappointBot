using FluentResults;
using Microsoft.EntityFrameworkCore;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.helpers;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.generic;
using ZapAgenda_api_aspnet.repositories.interfaces;
using ZapAgenda_api_aspnet.services.implementantions;
using ZapAgenda_api_aspnet.services.interfaces;

namespace ZapAgenda_api_aspnet.repositories.implementations
{
    public class UsuarioRepository : Repository<Usuario>, IUsuarioRepository
    {
        private readonly ICriptografarService _criptService;
        public UsuarioRepository(CoreDBContext context, ICriptografarService criptService) : base(context)
        {
            _criptService = criptService;
        }

        public async Task<Result<List<UsuarioDto>>> GetUsuariosByEmpresa(Guid IdEmpresa)
        {
            var usuarios = await _context.Usuario.Where(usuario => usuario.IdEmpresa == IdEmpresa).Select(s => s.ToUsuarioDto()).ToListAsync();
            if (usuarios.Count == 0) { return Result.Fail($"Não existe usuários na empresa de id{IdEmpresa}"); }

            return Result.Ok(usuarios);
        }

        public async Task<Result<Usuario>> CreateAsync(Usuario usuarioModel, Guid IdEmpresa)
        {
            var usuariosResult = await _context.Usuario
                .Where(usuario => usuario.IdEmpresa == IdEmpresa)
                .ToListAsync();

            if (usuariosResult == null) { return Result.Fail($"Erro ao buscar usuários da empresa de id {IdEmpresa}"); }

            var nomeUsuarioRepetido = VerificaDados.VerificaUsuario(usuariosResult, usuarioModel);
            if (nomeUsuarioRepetido.IsFailed) { return Result.Fail<Usuario>(nomeUsuarioRepetido.Errors); }

            var senhaAutorizada = VerificaDados.VerificaSenha(usuarioModel.Senha);
            if (senhaAutorizada.IsFailed) { return Result.Fail(senhaAutorizada.Errors); }

            if (!string.IsNullOrEmpty(usuarioModel.Cpf))
            {
                var IsCpf = VerificaDados.VerificaCpf(usuarioModel.Cpf);
                if (!IsCpf.IsSuccess)
                {
                    return Result.Fail(IsCpf.Errors);
                }
            }

            usuarioModel.IdEmpresa = IdEmpresa;
            usuarioModel.Senha = _criptService.HashSenha(usuarioModel.Senha);

            await _context.Usuario.AddAsync(usuarioModel);
            await _context.SaveChangesAsync();

            return Result.Ok(usuarioModel);
        }

        public async Task<Result<Usuario>> UpdateAsync(UpdateUsuarioDto updateUsuarioDto, int idUsuario, Guid IdEmpresa)
        {
            var usuarioModel = await _context.Usuario.FindAsync(idUsuario);
            if (usuarioModel == null)
            {
                return Result.Fail<Usuario>("Usuário não encontrado.");
            }

            var usuarioPertenceEmpresa = VerificaEmpresa.PertenceEmpresa(usuarioModel.IdEmpresa, IdEmpresa);
            if (usuarioPertenceEmpresa.IsFailed)
            {
                return Result.Fail(usuarioPertenceEmpresa.Errors);
            }
            usuarioModel.IdCargo = updateUsuarioDto.IdCargo;

            if (!string.IsNullOrEmpty(updateUsuarioDto.Cpf))
            {
                var CpfIsValido = VerificaDados.VerificaCpf(updateUsuarioDto.Cpf);
                if (CpfIsValido.IsFailed)
                {
                    return Result.Fail(CpfIsValido.Errors);
                }
            }

            usuarioModel.NomeUsuario = updateUsuarioDto.NomeUsuario;
            usuarioModel.NomeInteiro = updateUsuarioDto.NomeInteiro;
            usuarioModel.Email = updateUsuarioDto.Email;
            usuarioModel.UltimaModificacao = DateTime.UtcNow;
            _context.Usuario.Update(usuarioModel);
            await _context.SaveChangesAsync();

            return Result.Ok(usuarioModel);
        }

        public async Task<Result<Usuario>> UpdateSenhaAsync(UpdateSenhaUsuarioDto updateSenhaUsuarioDto, int idUsuario, Guid IdEmpresa)
        {
            var usuarioModel = await _context.Usuario.FindAsync(idUsuario);
            if (usuarioModel == null)
            {
                return Result.Fail($"Não existe usuário de id{idUsuario}");
            }

            var usuarioPertenceEmpresa = VerificaEmpresa.PertenceEmpresa(usuarioModel.IdEmpresa, IdEmpresa);
            if (usuarioPertenceEmpresa.IsFailed)
            {
                return Result.Fail(usuarioPertenceEmpresa.Errors);
            }

            var senhaAntigaIsCorreta = _criptService.VerifySenha(updateSenhaUsuarioDto.SenhaAntiga, usuarioModel.Senha);
            if (senhaAntigaIsCorreta.IsFailed)
            {
                return Result.Fail(senhaAntigaIsCorreta.Errors);
            }

            var senhaAutorizada = VerificaDados.VerificaSenha(updateSenhaUsuarioDto.Senha);
            if (senhaAutorizada.IsFailed)
            {
                return Result.Fail(senhaAutorizada.Errors);
            }

            usuarioModel.Senha = _criptService.HashSenha(updateSenhaUsuarioDto.Senha);
            usuarioModel.UltimaModificacao = DateTime.Now;
            _context.Usuario.Update(usuarioModel);
            await _context.SaveChangesAsync();
            return Result.Ok(usuarioModel);
        }

        public async Task<Result<UsuarioComSenhaDto>> GetUsariosByEmpresaAndNomeUsuario(Guid IdEmpresa, string nomeUsuario)
        {
            var usuario = await _context.Usuario.FirstOrDefaultAsync(usuario => usuario.NomeUsuario == nomeUsuario && usuario.IdEmpresa == IdEmpresa);
            if (usuario == null)
            {
                return Result.Fail("Não existe Usuário com esse nome de usuário");
            }
            var usuarioDto = usuario.ToUsuarioComSenhaDto();
            return Result.Ok(usuarioDto);
        }

        public async Task<Result<Usuario>> GetByIdAsync(int idUsuario, Guid IdEmpresa)
        {
            var usuario = await _context.Usuario.FirstOrDefaultAsync(usu => usu.Id == idUsuario);
            if (usuario == null)
            {
                return Result.Fail($"Não existe usuário de id: {idUsuario}");
            }
            if (usuario.IdEmpresa != IdEmpresa)
            {
                return Result.Fail($"Usuario não pertence a empresa");
            }
            return Result.Ok(usuario);
        }

        public async Task<Result<List<NomeUsuarioDto>>> GetNomeUsuarioDto(Guid IdEmpresa)
        {
            var usuarios = await _context.Usuario.Where(usuario => usuario.IdEmpresa == IdEmpresa).Select(s => s.ToNomeUsuarioDto()).ToListAsync();
            if (usuarios.Count == 0)
            {
                return Result.Fail("Não contém usuários");
            }
            return Result.Ok(usuarios);
        }
    }
}