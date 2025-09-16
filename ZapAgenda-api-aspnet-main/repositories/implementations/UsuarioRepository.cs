using FluentResults;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.Dtos.Usuario;
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

        public async Task<Result<List<UsuarioDto>>> GetAllAsyncDetailed()
        {
            var usuarios = await _context.Usuario
                .Select(usuario => usuario.ToUsuarioDto())
                .ToListAsync();

            return Result.Ok(usuarios);
        }

        public async Task<Result<Usuario>> CreateAsync(Usuario usuarioModel)
        {
            var usuariosResult = await _context.Usuario.ToListAsync();

            var nomeUsuarioRepetido = VerificaDados.VerificaUsuario(usuariosResult, usuarioModel);
            if (nomeUsuarioRepetido.IsFailed) { return Result.Fail<Usuario>(nomeUsuarioRepetido.Errors); }

            var senhaAutorizada = VerificaDados.VerificaSenha(usuarioModel.Senha);
            if (senhaAutorizada.IsFailed) { return Result.Fail(senhaAutorizada.Errors); }

            if (!string.IsNullOrEmpty(usuarioModel.Cpf))
            {
                var cpfLimpo = new string(usuarioModel.Cpf.Where(char.IsDigit).ToArray());
                var IsCpf = VerificaDados.VerificaCpf(cpfLimpo);
                if (!IsCpf.IsSuccess)
                {
                    return Result.Fail(IsCpf.Errors);
                }

                usuarioModel.Cpf = cpfLimpo;
            }

            usuarioModel.Senha = _criptService.HashSenha(usuarioModel.Senha);

            await _context.Usuario.AddAsync(usuarioModel);
            await _context.SaveChangesAsync();

            return Result.Ok(usuarioModel);
        }

        public async Task<Result<Usuario>> UpdateAsync(UpdateUsuarioDto updateUsuarioDto, int idUsuario)
        {
            var usuarioModel = await _context.Usuario.FindAsync(idUsuario);
            if (usuarioModel == null)
            {
                return Result.Fail<Usuario>("Usuário não encontrado.");
            }

            var nomeUsuarioDuplicado = await _context.Usuario
                .AnyAsync(usuario => usuario.Id != idUsuario && usuario.NomeUsuario == updateUsuarioDto.NomeUsuario);
            if (nomeUsuarioDuplicado)
            {
                return Result.Fail("Não pode ter usuários com o mesmo nome de usuário.");
            }
            usuarioModel.IdCargo = updateUsuarioDto.IdCargo;

            if (updateUsuarioDto.Cpf != null)
            {
                if (string.IsNullOrWhiteSpace(updateUsuarioDto.Cpf))
                {
                    usuarioModel.Cpf = null;
                }
                else
                {
                    var cpfLimpo = new string(updateUsuarioDto.Cpf.Where(char.IsDigit).ToArray());
                    var CpfIsValido = VerificaDados.VerificaCpf(cpfLimpo);
                    if (CpfIsValido.IsFailed)
                    {
                        return Result.Fail(CpfIsValido.Errors);
                    }
                    usuarioModel.Cpf = cpfLimpo;
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

        public async Task<Result<Usuario>> UpdateSenhaAsync(UpdateSenhaUsuarioDto updateSenhaUsuarioDto, int idUsuario)
        {
            var usuarioModel = await _context.Usuario.FindAsync(idUsuario);
            if (usuarioModel == null)
            {
                return Result.Fail($"Não existe usuário de id{idUsuario}");
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

        public async Task<Result<UsuarioComSenhaDto>> GetByNomeUsuarioAsync(string nomeUsuario)
        {
            var usuario = await _context.Usuario.FirstOrDefaultAsync(usuario => usuario.NomeUsuario == nomeUsuario);
            if (usuario == null)
            {
                return Result.Fail("Não existe Usuário com esse nome de usuário");
            }
            var usuarioDto = usuario.ToUsuarioComSenhaDto();
            return Result.Ok(usuarioDto);
        }

        public async Task<Result<List<NomeUsuarioDto>>> GetNomeUsuarioDto()
        {
            var usuarios = await _context.Usuario
                .Select(usuario => usuario.ToNomeUsuarioDto())
                .ToListAsync();

            return Result.Ok(usuarios);
        }
    }
}