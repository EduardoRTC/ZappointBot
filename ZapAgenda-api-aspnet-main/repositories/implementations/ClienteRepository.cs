using FluentResults;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.Dtos.Cliente;
using ZapAgenda_api_aspnet.helpers;
using ZapAgenda_api_aspnet.Mappers;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.generic;
using ZapAgenda_api_aspnet.repositories.interfaces;
using ZapAgenda_api_aspnet.services.implementantions;

namespace ZapAgenda_api_aspnet.repositories.implementations
{
    public class ClienteRepository : Repository<Cliente>, IClienteRepository
    {
        public ClienteRepository(CoreDBContext context) : base(context)
        {

        }

        public async Task<List<ClienteDto>> GetAllPorEmpresaAsync(Guid IdEmpresa)
        {
            return await _context.Cliente.Where(cliente => cliente.IdEmpresa == IdEmpresa).Select(cliente => cliente.ToClienteDto()).ToListAsync();
        }
        public async Task<Result<Cliente>> CreateAsync(Cliente cliente, Guid IdEmpresa)
        {
            var cpfLimpo = new string(cliente.Cpf.Where(char.IsDigit).ToArray());
            var IsCpf = VerificaDados.VerificaCpf(cpfLimpo);
            if (IsCpf.IsFailed)
            {
                return Result.Fail(IsCpf.Errors);
            }

            var clientes = await GetAllPorEmpresaAsync(IdEmpresa);
            if (clientes.Any(c => c.Cpf == cpfLimpo))
            {
                return Result.Fail("Já existe Cliente com o mesmo cpf");
            }

            cliente.Cpf = cpfLimpo;
            cliente.IdEmpresa = IdEmpresa;

            await _context.Cliente.AddAsync(cliente);
            await _context.SaveChangesAsync();

            return Result.Ok(cliente);
        }

        public async Task<Result<Cliente>> UpdateAsync(UpdateClienteDto updateClienteDto, int IdCliente, Guid IdEmpresa)
        {
            var cliente = await GetById(IdCliente, IdEmpresa);
            var clienteValores = cliente.Value;
            var IsCpf = VerificaDados.VerificaCpf(clienteValores.Cpf);
            if (IsCpf.IsFailed)
            {
                return Result.Fail("Cpf não é valido");
            }
            var clientePertenceEmpresa = VerificaEmpresa.PertenceEmpresa(clienteValores.IdEmpresa, IdEmpresa);
            if (clientePertenceEmpresa.IsFailed)
            {
                return Result.Fail("Cliente não pertence a empresa");
            }
            clienteValores.Cpf = updateClienteDto.Cpf;
            clienteValores.Nome = updateClienteDto.Nome;
            clienteValores.Email = updateClienteDto.Email;
            clienteValores.DataNascimento = updateClienteDto.DataNascimento;
            clienteValores.Observacao = updateClienteDto.Observacao;
            clienteValores.Telefone = updateClienteDto.Telefone;
            clienteValores.Status = updateClienteDto.Status;

            await _context.SaveChangesAsync();
            return Result.Ok(clienteValores);
        }

        public async Task<Result<Cliente>> GetById(int IdCliente, Guid Idempresa)
        {
            var cliente = await _context.Cliente.FirstOrDefaultAsync(cliente => cliente.Id == IdCliente);
            if (cliente == null)
            {
                return Result.Fail($"Não existe cliente de id: {IdCliente}");
            }
            if (cliente.IdEmpresa != Idempresa)
            {
                return Result.Fail("Cliente não pertence a empresa");
            }
            return Result.Ok(cliente);
        }

        public async Task<Result<Cliente>> GetByCpfAsync(string cpf, Guid IdEmpresa)
        {
            var cpfLimpo = new string(cpf.Where(char.IsDigit).ToArray());
            var cpfValido = VerificaDados.VerificaCpf(cpfLimpo);
            if (cpfValido.IsFailed)
            {
                return Result.Fail(cpfValido.Errors);
            }

            var cliente = await _context.Cliente.FirstOrDefaultAsync(c => c.Cpf == cpfLimpo && c.IdEmpresa == IdEmpresa);
            if (cliente == null)
            {
                return Result.Fail($"Não existe cliente de cpf: {cpf}");
            }
            return Result.Ok(cliente);
        }
    }
}