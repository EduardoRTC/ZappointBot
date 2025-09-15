using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.repositories.interfaces;
using ZapAgenda_api_aspnet.helpers;

namespace ZapAgenda_api_aspnet.controllers
{
    [Route("usuario")]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioRepository _usuarioRepo;
        private readonly IEmpresaRepository _empresaRepo;
        public UsuarioController(IUsuarioRepository usuariorepo, IEmpresaRepository empresaRepo)
        {
            _usuarioRepo = usuariorepo;
            _empresaRepo = empresaRepo;
        }

        //[Authorize]
        [HttpGet("{idUsuario:int}")]
        public async Task<IActionResult> GetById([FromRoute] int idUsuario)
        {
            var IdEmpresa = EmpresaConfig.DefaultId;
            if (await _empresaRepo.GetByGuidAsync(IdEmpresa) == null)
            {
                return NotFound($"Não existe empresa com ID {IdEmpresa}.");
            }

            var usuario = await _usuarioRepo.GetByIdAsync(idUsuario);
            if (usuario == null)
            {
                return NotFound($"Não existe usuário de Id: {idUsuario}");
            }

            if (usuario.Value.IdEmpresa != IdEmpresa)
            {
                return BadRequest("Usuário não pertence a empresa");
            }
            return Ok(usuario.Value);
        }

        //[Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUsuarioDto createUsuarioDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var IdEmpresa = EmpresaConfig.DefaultId;
            if (await _empresaRepo.GetByGuidAsync(IdEmpresa) == null)
            {
                return NotFound($"Não existe empresa com ID {IdEmpresa}.");
            }
            var usuario = createUsuarioDto.ToCreateUsuarioDto();

            var result = await _usuarioRepo.CreateAsync(usuario, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(new { Erros = result.Errors.Select(e => e.Message) });
            }
            return CreatedAtAction(nameof(GetById), new { idUsuario = usuario.Id }, usuario);
        }

        //[Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAllByIdEmpresa()
        {
            var usuarios = await _usuarioRepo.GetUsuariosByEmpresa(EmpresaConfig.DefaultId);
            if (!usuarios.IsSuccess)
            {
                return NotFound(new { message = usuarios.Errors });
            }
            return Ok(usuarios.Value);
        }

        [HttpGet("opcoes-filtro")]
        public async Task<IActionResult> GetAllByEmpresaParaFiltro()
        {
            var usuarios = await _usuarioRepo.GetNomeUsuarioDto(EmpresaConfig.DefaultId);
            if (usuarios.IsFailed)
            {
                return BadRequest(usuarios.Errors);
            }
            return Ok(usuarios.Value);
        }

        [Authorize]
        [HttpPut("{idUsuario:int}")]
        public async Task<IActionResult> UpdateUsuario([FromBody] UpdateUsuarioDto updateUsuarioDto, [FromRoute] int idUsuario)
        {

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var IdEmpresa = EmpresaConfig.DefaultId;
            if (await _empresaRepo.GetByGuidAsync(IdEmpresa) == null)
            {
                return NotFound($"Não existe empresa de id{IdEmpresa}");
            }
            var result = await _usuarioRepo.UpdateAsync(updateUsuarioDto, idUsuario, IdEmpresa);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Errors);
            }
            return Ok(result.Value);
        }

        [Authorize]
        [HttpPatch("{idUsuario:int}")]
        public async Task<IActionResult> UpdateSenhaUsuario([FromBody] UpdateSenhaUsuarioDto updateSenhaUsuarioDto, [FromRoute] int idUsuario)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var IdEmpresa = EmpresaConfig.DefaultId;
            if (await _empresaRepo.GetByGuidAsync(IdEmpresa) == null)
            {
                return NotFound($"Não existe empresa de id{IdEmpresa}");
            }
            var result = await _usuarioRepo.UpdateSenhaAsync(updateSenhaUsuarioDto, idUsuario, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }

            return NoContent();
        }


    }
}