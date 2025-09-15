using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Servico;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.repositories.interfaces;
using ZapAgenda_api_aspnet.helpers;

namespace ZapAgenda_api_aspnet.controllers
{
    [Route("servico")]
    public class ServicoController : ControllerBase
    {
        private readonly IServicoRepository _servicoRepo;
        public ServicoController(IServicoRepository servicoRepo)
        {
            _servicoRepo = servicoRepo;
        }

        [HttpGet("{IdServico}")]
        public async Task<IActionResult> GetById([FromRoute] int IdServico)
        {
            var servico = await _servicoRepo.GetById(IdServico, EmpresaConfig.DefaultId);
            if (servico.IsFailed)
            {
                return BadRequest(servico.Errors);
            }
            return Ok(servico.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllByIdEmpresa()
        {
            var servicos = await _servicoRepo.GetAllByEmpresa(EmpresaConfig.DefaultId);
            if (servicos.IsFailed)
            {
                return BadRequest(servicos.Errors);
            }
            return Ok(servicos);
        }

        //todo:ver pq não retorna o objeto da empresa
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateServicoDto createServicoDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var servico = createServicoDto.ToCreateServicoDto();
            var result = await _servicoRepo.CreateAsync(servico, EmpresaConfig.DefaultId);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }
            return CreatedAtAction(nameof(GetById), new { idServico = servico.Id }, servico);
        }

        [HttpPut("{idServico}")]
        public async Task<IActionResult> Update([FromBody] UpdateServicoDto updateServicoDto, [FromRoute] int idServico)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _servicoRepo.UpdateAsync(updateServicoDto, idServico, EmpresaConfig.DefaultId);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }
            return Ok(result.Value);
        }
    }
}