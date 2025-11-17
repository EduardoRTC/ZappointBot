using FluentResults;
using Microsoft.EntityFrameworkCore;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.helpers;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.models.Enums;
using ZapAgenda_api_aspnet.repositories.generic;
using ZapAgenda_api_aspnet.repositories.interfaces;
using ZapAgenda_api_aspnet.services.implementantions;
using ZapAgenda_api_aspnet.services.interfaces;

namespace ZapAgenda_api_aspnet.repositories.implementations
{
    public class UsuarioRepository : Repository<Usuario>, IUsuarioRepository
    {
        private readonly ICriptografarService _criptService;
        private readonly IEmpresaRepository _empresaRepo;
        public UsuarioRepository(CoreDBContext context, ICriptografarService criptService, IEmpresaRepository empresaRepo) : base(context)
        {
            _criptService = criptService;
            _empresaRepo = empresaRepo;
        }

        public async Task<Result<List<UsuarioDto>>> GetUsuariosByEmpresa(Guid IdEmpresa)
        {
            var usuarios = await _context.Usuario.Where(usuario => usuario.IdEmpresa == IdEmpresa && usuario.Status == true).Select(s => s.ToUsuarioDto()).ToListAsync();

            return Result.Ok(usuarios);
        }

        public async Task<Result<Usuario>> CreateAsync(CreateUsuarioDto dto, Guid IdEmpresa)
        {
            // 🔹 Busca os usuários da empresa
            var usuariosResult = await _context.Usuario
                .Where(usuario => usuario.IdEmpresa == IdEmpresa)
                .ToListAsync();

            if (usuariosResult == null)
                return Result.Fail($"Erro ao buscar usuários da empresa de id {IdEmpresa}");

            // 🔹 Monta o modelo de domínio
            var usuarioModel = dto.ToCreateUsuarioDto();
            usuarioModel.IdEmpresa = IdEmpresa;

            // 🔹 Validações
            var nomeUsuarioRepetido = VerificaDados.VerificaUsuario(usuariosResult, usuarioModel);
            if (nomeUsuarioRepetido.IsFailed)
                return Result.Fail<Usuario>(nomeUsuarioRepetido.Errors);

            var senhaAutorizada = VerificaDados.VerificaSenha(usuarioModel.Senha);
            if (senhaAutorizada.IsFailed)
                return Result.Fail(senhaAutorizada.Errors);

            if (!string.IsNullOrEmpty(usuarioModel.Cpf))
            {
                var isCpf = VerificaDados.VerificaCpf(usuarioModel.Cpf);
                if (isCpf.IsFailed)
                    return Result.Fail(isCpf.Errors);
            }

            // 🔹 Criptografa a senha
            usuarioModel.Senha = _criptService.HashSenha(usuarioModel.Senha);

            // 🔹 Salva o usuário
            await _context.Usuario.AddAsync(usuarioModel);
            await _context.SaveChangesAsync();

            // 🔹 Busca a empresa para verificar o tipo
            var empresaResult = await _empresaRepo.GetById(IdEmpresa);
            if (empresaResult.IsSuccess && empresaResult.Value.TipoEmpresa == TipoEmpresa.CLINICA)
            {
                if (dto.ProfissionalSaude != null)
                {
                    var profissional = dto.ProfissionalSaude.ToProfissionalSaude(usuarioModel.Id);
                    await _context.ProfissionalSaude.AddAsync(profissional);
                    await _context.SaveChangesAsync();
                }
            }

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

        public async Task<Result<Usuario>> DeleteAsync(int idUsuario, Guid IdEmpresa)
        {
            var usuario = await _context.Usuario.FirstOrDefaultAsync(x => x.Id == idUsuario);
            if (usuario == null)
            {
                return Result.Fail($"Não existe usuário de id: {idUsuario}");
            }
            if (usuario.IdEmpresa != IdEmpresa)
            {
                return Result.Fail($"Usuario não pertence a empresa");
            }
            usuario.Status = false;
            _context.Usuario.Update(usuario);
            await _context.SaveChangesAsync();
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

        public async Task<Result<Usuario>> UpdateSenhaByNomeUsuarioAsync(Guid idEmpresa, string nomeUsuario, string novaSenha)
        {
            // 🔹 Busca o usuário pelo nome de usuário e empresa
            var usuario = await _context.Usuario
                .FirstOrDefaultAsync(u => u.NomeUsuario == nomeUsuario && u.IdEmpresa == idEmpresa);

            if (usuario == null)
                return Result.Fail($"Não existe usuário com o nome '{nomeUsuario}' nesta empresa.");

            // 🔹 Verifica se o usuário pertence à empresa (garantia extra)
            var usuarioPertenceEmpresa = VerificaEmpresa.PertenceEmpresa(usuario.IdEmpresa, idEmpresa);
            if (usuarioPertenceEmpresa.IsFailed)
                return Result.Fail(usuarioPertenceEmpresa.Errors);

            // 🔹 Valida a nova senha
            var senhaAutorizada = VerificaDados.VerificaSenha(novaSenha);
            if (senhaAutorizada.IsFailed)
                return Result.Fail(senhaAutorizada.Errors);

            // 🔹 Criptografa e atualiza
            usuario.Senha = _criptService.HashSenha(novaSenha);
            usuario.UltimaModificacao = DateTime.UtcNow;

            _context.Usuario.Update(usuario);
            await _context.SaveChangesAsync();

            return Result.Ok(usuario);
        }

    }
}