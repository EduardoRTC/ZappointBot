using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Agendamento;
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

        //[Authorize]
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

        ///[Authorize]
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

            //[Authorize]
            [HttpGet]
            public async Task<IActionResult> GetAllByIdEmpresa(Guid IdEmpresa, int? IdUsuario = null)
            {
                var agendamento = await _agendamentoRepo.GetAllByEmpresa(IdEmpresa, IdUsuario);
                if (agendamento.IsFailed)
                {
                    return NotFound(agendamento.Errors);
                }
                return Ok(agendamento.Value);
            }

        //[Authorize]
        [HttpPut("{IdAgendamento}")]
        public async Task<IActionResult> Update([FromBody] UpdateAgendamentoDto updateAgendamentoDto, [FromRoute] int IdAgendamento, Guid IdEmpresa)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _agendamentoRepo.UpdateAsync(updateAgendamentoDto, IdAgendamento, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }
            return Ok(result);
        }
    }
}