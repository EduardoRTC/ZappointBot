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
    [Route("agendamento")]
    public class AgendamentoController : ControllerBase
    {
        private readonly IAgendamentoRepository _agendamentoRepo;
        public AgendamentoController(IAgendamentoRepository agendamentoRepo)
        {
            _agendamentoRepo = agendamentoRepo;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAgendamentoDto createAgendamentoDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var agendamento = await _agendamentoRepo.CreateAsync(createAgendamentoDto);
            if (agendamento.IsFailed)
            {
                return BadRequest(agendamento.Errors);
            }
            return Ok(agendamento);

        }
        [HttpGet("{IdAgendamento}")]
        public async Task<IActionResult> GetById([FromRoute] int IdAgendamento)
        {
            var agendamento = await _agendamentoRepo.GetByIdAsync(IdAgendamento);
            if (agendamento.IsFailed)
            {
                return BadRequest(agendamento.Errors);
            }
            return Ok(agendamento);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {

            var agendamento = await _agendamentoRepo.GetAllAsync();
            if(agendamento.IsFailed) {
                return NotFound(agendamento.Errors);
            }
            return Ok(agendamento.Value);
        }

        [HttpPut("{IdAgendamento}")]
        public async Task<IActionResult> Update([FromBody] UpdateAgendamentoDto updateAgendamentoDto,[FromRoute] int IdAgendamento) {
            if(!ModelState.IsValid) {
                return BadRequest(ModelState);
            }

            var result = await _agendamentoRepo.UpdateAsync(updateAgendamentoDto,IdAgendamento);
            if(result.IsFailed) {
                return BadRequest(result.Errors);
            }
            return Ok(result);
        }
    }
}