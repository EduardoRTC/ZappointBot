using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Cliente;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.controllers
{
    [ApiController]
    [Route("cliente")]
    public class ClienteController : ControllerBase
    {
        private readonly IClienteRepository _clienteRepo;

        public ClienteController(IClienteRepository clienteRepo)
        {
            _clienteRepo = clienteRepo;
        }

        // Lista todos os clientes da empresa
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var clientes = await _clienteRepo.GetAllAsyncDetailed();
            return Ok(clientes);
        }

        // Consulta por CPF (rota dedicada)
        [HttpGet("by-cpf")]
        public async Task<IActionResult> GetByCpf([FromQuery] string cpf)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                return BadRequest("CPF obrigatório.");

            var cliente = await _clienteRepo.GetByCpfAsync(cpf);
            if (cliente.IsFailed) return BadRequest(cliente.Errors);

            return Ok(new[] { cliente.Value });
        }

        // Busca por ID
        [HttpGet("{idCliente:int}")]
        public async Task<IActionResult> GetById([FromRoute] int idCliente)
        {
            var cliente = await _clienteRepo.GetByIdAsync(idCliente);
            if (cliente.IsFailed) return BadRequest(cliente.Errors);

            return Ok(cliente.Value);
        }

        // Criação
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClienteDto createClienteDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var cliente = createClienteDto.ToCreateClienteDto();
            var result = await _clienteRepo.CreateAsync(cliente);
            if (result.IsFailed) return BadRequest(result.Errors);

            return CreatedAtAction(nameof(GetById), new { idCliente = cliente.Id }, cliente);
        }

        // Atualização
        [HttpPut("{IdCliente:int}")]
        public async Task<IActionResult> Update([FromBody] UpdateClienteDto updateClienteDto, [FromRoute] int IdCliente)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _clienteRepo.UpdateAsync(updateClienteDto, IdCliente);
            if (result.IsFailed) return BadRequest(result.Errors);

            return Ok(result.Value);
        }
    }
}
