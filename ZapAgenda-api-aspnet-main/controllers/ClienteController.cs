using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Cliente;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.controllers
{
    [Route("{IdEmpresa}/cliente")]
    public class ClienteController : ControllerBase
    {
        private readonly IClienteRepository _clienteRepo;
        private readonly IEmpresaRepository _empresaRepo;
        public ClienteController(IClienteRepository clienteRepo, IEmpresaRepository empresaRepo)
        {
            _clienteRepo = clienteRepo;
            _empresaRepo = empresaRepo;
        }


        [HttpGet("{idCliente}")]
        public async Task<IActionResult> GetById([FromRoute] int idCliente, Guid IdEmpresa)
        {

            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed)
            {
                return NotFound(empresa.Errors);
            }
            var cliente = await _clienteRepo.GetByIdAsync(idCliente);
            if (cliente.IsFailed)
            {
                return BadRequest(cliente.Errors);
            }

            if (cliente.Value.IdEmpresa != IdEmpresa)
            {
                return BadRequest("Cliente não percente a empresa");
            }

            return Ok(cliente.Value);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClienteDto createClienteDto, Guid IdEmpresa)
        {
            if (!ModelState.IsValid) { return BadRequest(ModelState); }
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed)
            {
                return NotFound(empresa.Errors);
            }
            var cliente = createClienteDto.ToCreateClienteDto();
            var result = await _clienteRepo.CreateAsync(cliente, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }
            return CreatedAtAction(nameof(GetById), new { idCliente = cliente.Id, IdEmpresa = IdEmpresa }, cliente);
        }

        [HttpPut("{IdCliente}")]
        public async Task<IActionResult> Update([FromBody] UpdateClienteDto updateClienteDto, [FromRoute] int IdCliente, Guid IdEmpresa)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed)
            {
                return BadRequest("Empresa não existe");
            }

            var result = await _clienteRepo.UpdateAsync(updateClienteDto, IdCliente, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }
            return Ok(result.Value);
        }
    }
}