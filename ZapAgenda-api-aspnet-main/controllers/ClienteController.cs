using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Dtos.Cliente;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.repositories.interfaces;
using ZapAgenda_api_aspnet.helpers;

namespace ZapAgenda_api_aspnet.controllers
{
    [ApiController]
    [Route("cliente")]
    public class ClienteController : ControllerBase
    {
        private readonly IClienteRepository _clienteRepo;
        private readonly IEmpresaRepository _empresaRepo;

        public ClienteController(IClienteRepository clienteRepo, IEmpresaRepository empresaRepo)
        {
            _clienteRepo = clienteRepo;
            _empresaRepo = empresaRepo;
        }

        // Lista todos os clientes da empresa
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var IdEmpresa = EmpresaConfig.DefaultId;
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed) return NotFound(empresa.Errors);

            var clientes = await _clienteRepo.GetAllPorEmpresaAsync(IdEmpresa);
            return Ok(clientes);
        }

        // Consulta por CPF (rota dedicada)
        [HttpGet("by-cpf")]
        public async Task<IActionResult> GetByCpf([FromQuery] string cpf)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                return BadRequest("CPF obrigatório.");

            var IdEmpresa = EmpresaConfig.DefaultId;
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed) return NotFound(empresa.Errors);

            var cliente = await _clienteRepo.GetByCpfAsync(cpf, IdEmpresa);
            if (cliente.IsFailed) return BadRequest(cliente.Errors);

            return Ok(new[] { cliente.Value });
        }

        // Busca por ID
        [HttpGet("{idCliente:int}")]
        public async Task<IActionResult> GetById([FromRoute] int idCliente)
        {
            var IdEmpresa = EmpresaConfig.DefaultId;
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed) return NotFound(empresa.Errors);

            var cliente = await _clienteRepo.GetByIdAsync(idCliente);
            if (cliente.IsFailed) return BadRequest(cliente.Errors);
            if (cliente.Value.IdEmpresa != IdEmpresa) return BadRequest("Cliente não percente a empresa");

            return Ok(cliente.Value);
        }

        // Criação
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClienteDto createClienteDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var IdEmpresa = EmpresaConfig.DefaultId;
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed) return NotFound(empresa.Errors);

            var cliente = createClienteDto.ToCreateClienteDto();
            var result = await _clienteRepo.CreateAsync(cliente, IdEmpresa);
            if (result.IsFailed) return BadRequest(result.Errors);

            return CreatedAtAction(nameof(GetById), new { idCliente = cliente.Id }, cliente);
        }

        // Atualização
        [HttpPut("{IdCliente:int}")]
        public async Task<IActionResult> Update([FromBody] UpdateClienteDto updateClienteDto, [FromRoute] int IdCliente)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var IdEmpresa = EmpresaConfig.DefaultId;
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed) return BadRequest("Empresa não existe");

            var result = await _clienteRepo.UpdateAsync(updateClienteDto, IdCliente, IdEmpresa);
            if (result.IsFailed) return BadRequest(result.Errors);

            return Ok(result.Value);
        }
    }
}
