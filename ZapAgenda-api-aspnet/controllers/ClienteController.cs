using Microsoft.AspNetCore.Authorization;
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

        //[Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAllPorEmpresa([FromRoute] Guid IdEmpresa)
        {
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed)
            {
                return NotFound(empresa.Errors);
            }

            var clientes = await _clienteRepo.GetAllPorEmpresaAsync(IdEmpresa);
            return Ok(clientes);
        }

        //[Authorize]
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

        //[Authorize]
        [HttpGet("cpf/{cpf}")]
        public async Task<IActionResult> GetByCpf([FromRoute] string cpf, [FromRoute] Guid IdEmpresa)
        {
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed)
            {
                return NotFound(empresa.Errors);
            }

            var cliente = await _clienteRepo.GetByCpf(cpf, IdEmpresa);
            if (cliente.IsFailed)
            {
                return NotFound(cliente.Errors);
            }

            return Ok(cliente.Value);
        }

        //[Authorize]
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

        //[Authorize]
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

        //[Authorize]
        [HttpDelete("{IdCliente}")]
        public async Task<IActionResult> Delete([FromRoute] int IdCliente, [FromRoute] Guid IdEmpresa)
        {
            var empresa = await _empresaRepo.GetByGuidAsync(IdEmpresa);
            if (empresa.IsFailed)
            {
                return NotFound(empresa.Errors);
            }

            var result = await _clienteRepo.DeleteAsync(IdCliente, IdEmpresa);
            if (result.IsFailed)
            {
                return BadRequest(result.Errors);
            }

            return Ok(new
            {
                message = "Cliente desativado com sucesso.",
                cliente = result.Value
            });
        }

    }
}