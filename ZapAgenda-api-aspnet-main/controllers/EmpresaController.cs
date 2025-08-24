using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Empresa;
using ZapAgenda_api_aspnet.Exceptions;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.controllers
{
    [Route("empresa")]
    [ApiController]
    public class EmpresaController : ControllerBase
    {
        private readonly IEmpresaRepository _empresaRepo;
        public EmpresaController(IEmpresaRepository empresaRepo)
        {
            _empresaRepo = empresaRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var empresa = await _empresaRepo.GetAllAsync();
            return Ok(empresa);
        }

        //[Authorize]
        [HttpGet("{id:Guid}")]
        public async Task<IActionResult> GetById([FromRoute] Guid id)
        {
            var empresa = await _empresaRepo.GetByGuidAsync(id);
            if (empresa == null)
            {
                throw new CustomBadRequest(
                    title: "Não existe a empresa",
                    detail: $"Não existe empresa de código: {id}"
                );
            }
            return Ok(empresa.Value);
        }

        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmpresaDto empresaDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var empresaModel = empresaDto.ToCreateEmpresaDto();
            await _empresaRepo.CreateAsync(empresaModel);
            return CreatedAtAction(nameof(GetById), new { id = empresaModel.IdEmpresa }, empresaModel);
        }

        [Authorize]
        [HttpDelete("{id:Guid}")]
        public async Task<IActionResult> Delete([FromRoute] Guid id)
        {
            var empresa = await _empresaRepo.DeleteAsync(id);
            if (empresa == null)
            {
                throw new CustomBadRequest(
                    title: "Não existe a empresa",
                    detail: $"Não existe empresa de código: {id}"
                );
            }
            return NoContent();
        }

        //[Authorize]
        [HttpPut("{id:Guid}")]
        public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateEmpresaDto empresaDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var empresa = await _empresaRepo.UpdateAsync(empresaDto, id);
            if (empresa.IsFailed)
            {
                return NotFound($"Não existe empresa de id: {id}");
            }
            return Ok(empresa.Value);
        }
    }
}