using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.controllers
{
    [Route("usuario")]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioRepository _usuarioRepo;
        public UsuarioController(IUsuarioRepository usuariorepo)
        {
            _usuarioRepo = usuariorepo;
        }

        //[Authorize]
        [HttpGet("{idUsuario:int}")]
        public async Task<IActionResult> GetById([FromRoute] int idUsuario)
        {
            var usuario = await _usuarioRepo.GetByIdAsync(idUsuario);
            if (usuario.IsFailed)
            {
                return NotFound(usuario.Errors);
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
            var usuario = createUsuarioDto.ToCreateUsuarioDto();

            var result = await _usuarioRepo.CreateAsync(usuario);
            if (result.IsFailed)
            {
                return BadRequest(new { Erros = result.Errors.Select(e => e.Message) });
            }
            return CreatedAtAction(nameof(GetById), new { idUsuario = usuario.Id }, usuario);
        }

        //[Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var usuarios = await _usuarioRepo.GetAllAsyncDetailed();
            if (!usuarios.IsSuccess)
            {
                return NotFound(new { message = usuarios.Errors });
            }
            return Ok(usuarios.Value);
        }

        [HttpGet("opcoes-filtro")]
        public async Task<IActionResult> GetAllByEmpresaParaFiltro()
        {
            var usuarios = await _usuarioRepo.GetNomeUsuarioDto();
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

            var result = await _usuarioRepo.UpdateAsync(updateUsuarioDto, idUsuario);
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
            var result = await _usuarioRepo.UpdateSenhaAsync(updateSenhaUsuarioDto, idUsuario);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }

            return NoContent();
        }


    }
}