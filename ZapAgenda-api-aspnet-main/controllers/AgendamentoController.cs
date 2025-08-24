using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Agendamento;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.controllers
{
    [Route("{IdEmpresa}/agendamento")]
    public class AgendamentoController : ControllerBase
    {
        private readonly IAgendamentoRepository _agendamentoRepo;
        public AgendamentoController(IAgendamentoRepository agendamentoRepo)
        {
            _agendamentoRepo = agendamentoRepo;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAgendamentoDto createAgendamentoDto, Guid IdEmpresa)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var agendamento = await _agendamentoRepo.CreateAsync(createAgendamentoDto, IdEmpresa);
            if (agendamento.IsFailed)
            {
                return BadRequest(agendamento.Errors);
            }
            return Ok(agendamento);

        }
        [HttpGet("{IdAgendamento}")]
        public async Task<IActionResult> GetById([FromRoute] int IdAgendamento, Guid IdEmpresa)
        {
            var agendamento = await _agendamentoRepo.GetById(IdAgendamento, IdEmpresa);
            if (agendamento.IsFailed)
            {
                return BadRequest(agendamento.Errors);
            }
            return Ok(agendamento);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllByIdEmpresa(Guid IdEmpresa)
        {

            var agendamento = await _agendamentoRepo.GetAllByEmpresa(IdEmpresa);
            if(agendamento.IsFailed) {
                return NotFound(agendamento.Errors);
            }
            return Ok(agendamento.Value);
        }

        [HttpPut("{IdAgendamento}")]
        public async Task<IActionResult> Update([FromBody] UpdateAgendamentoDto updateAgendamentoDto,[FromRoute] int IdAgendamento,Guid IdEmpresa) {
            if(!ModelState.IsValid) {
                return BadRequest(ModelState);
            }

            var result = await _agendamentoRepo.UpdateAsync(updateAgendamentoDto,IdAgendamento,IdEmpresa);
            if(result.IsFailed) {
                return BadRequest(result.Errors);
            }
            return Ok(result);
        }
    }
}