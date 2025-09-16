using FluentResults;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.Dtos.Cliente;
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

        public async Task<List<ClienteDto>> GetAllAsyncDetailed()
        {
            return await _context.Cliente
                .Select(cliente => cliente.ToClienteDto())
                .ToListAsync();
        }

        public async Task<Result<Cliente>> CreateAsync(Cliente cliente)
        {
            var cpfLimpo = new string(cliente.Cpf.Where(char.IsDigit).ToArray());
            var cpfValido = VerificaDados.VerificaCpf(cpfLimpo);
            if (cpfValido.IsFailed)
            {
                return Result.Fail(cpfValido.Errors);
            }

            var cpfDuplicado = await _context.Cliente.AnyAsync(c => c.Cpf == cpfLimpo);
            if (cpfDuplicado)
            {
                return Result.Fail("Já existe Cliente com o mesmo CPF");
            }

            cliente.Cpf = cpfLimpo;

            await _context.Cliente.AddAsync(cliente);
            await _context.SaveChangesAsync();

            return Result.Ok(cliente);
        }

        public async Task<Result<Cliente>> UpdateAsync(UpdateClienteDto updateClienteDto, int IdCliente)
        {
            var cliente = await _context.Cliente.FirstOrDefaultAsync(cliente => cliente.Id == IdCliente);
            if (cliente == null)
            {
                return Result.Fail($"Não existe cliente de id: {IdCliente}");
            }

            var cpfLimpo = new string(updateClienteDto.Cpf.Where(char.IsDigit).ToArray());
            var cpfValidado = VerificaDados.VerificaCpf(cpfLimpo);
            if (cpfValidado.IsFailed)
            {
                return Result.Fail(cpfValidado.Errors);
            }

            var existeCpf = await _context.Cliente
                .AnyAsync(c => c.Id != IdCliente && c.Cpf == cpfLimpo);
            if (existeCpf)
            {
                return Result.Fail("Já existe Cliente com o mesmo CPF");
            }

            cliente.Cpf = cpfLimpo;
            cliente.Nome = updateClienteDto.Nome;
            cliente.Email = updateClienteDto.Email;
            cliente.DataNascimento = updateClienteDto.DataNascimento;
            cliente.Observacao = updateClienteDto.Observacao;
            cliente.Telefone = updateClienteDto.Telefone;
            cliente.Status = updateClienteDto.Status;

            await _context.SaveChangesAsync();
            return Result.Ok(cliente);
        }

        public async Task<Result<Cliente>> GetByCpfAsync(string cpf)
        {
            var cpfLimpo = new string(cpf.Where(char.IsDigit).ToArray());
            var cpfValido = VerificaDados.VerificaCpf(cpfLimpo);
            if (cpfValido.IsFailed)
            {
                return Result.Fail(cpfValido.Errors);
            }

            var cliente = await _context.Cliente
                .FirstOrDefaultAsync(c => c.Cpf == cpfLimpo);
            if (cliente == null)
            {
                return Result.Fail($"Não existe cliente de cpf: {cpf}");
            }
            return Result.Ok(cliente);
        }
    }
}