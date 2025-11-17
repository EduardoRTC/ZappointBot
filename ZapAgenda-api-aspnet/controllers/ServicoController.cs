using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Servico;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.controllers
{
    [Route("{IdEmpresa}/servico")]
    public class ServicoController : ControllerBase
    {
        private readonly IServicoRepository _servicoRepo;
        public ServicoController(IServicoRepository servicoRepo)
        {
            _servicoRepo = servicoRepo;
        }

        //[Authorize]
        [HttpGet("{IdServico}")]
        public async Task<IActionResult> GetById([FromRoute] int IdServico, Guid IdEmpresa)
        {
            var servico = await _servicoRepo.GetById(IdServico, IdEmpresa);
            if (servico.IsFailed)
            {
                return BadRequest(servico.Errors);
            }
            return Ok(servico.Value);
        }

        //[Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAllByIdEmpresa(Guid IdEmpresa)
        {
            var servicos = await _servicoRepo.GetAllByEmpresa(IdEmpresa);
            if (servicos.IsFailed)
            {
                return BadRequest(servicos.Errors);
            }
            return Ok(servicos.Value);
        }

        //todo:ver pq não retorna o objeto da empresa
        //[Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateServicoDto createServicoDto, Guid IdEmpresa)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var servico = createServicoDto.ToCreateServicoDto();
            var result = await _servicoRepo.CreateAsync(servico, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }
            return CreatedAtAction(nameof(GetById), new { idServico = servico.Id, IdEmpresa = IdEmpresa }, servico);
        }

        //[Authorize]
        [HttpPut("{idServico}")]
        public async Task<IActionResult> Update([FromBody] UpdateServicoDto updateServicoDto, [FromRoute] int idServico, Guid IdEmpresa)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _servicoRepo.UpdateAsync(updateServicoDto, idServico, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }
            return Ok(result.Value);
        }
        
        //[Authorize]
        [HttpDelete("{idServico}")]
        public async Task<IActionResult> Delete([FromRoute] int idServico, Guid IdEmpresa)
        {
            var result = await _servicoRepo.DeleteAsync(idServico, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }
            return Ok(result.Value);
        }

    }
}