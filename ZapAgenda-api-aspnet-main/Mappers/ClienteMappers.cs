using ZapAgenda_api_aspnet.Dtos.Cliente;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.Mappers
{
    public static class ClienteMappers
    {
        public static Cliente ToCreateClienteDto(this CreateClienteDto clienteDto) {
            return new Cliente {
                Cpf = clienteDto.Cpf,
                DataNascimento = clienteDto.DataNascimento,
                Nome = clienteDto.Nome,
                Observacao = clienteDto.Observacao,
                Telefone = clienteDto.Telefone
            };
        }
        public static ClienteDto ToClienteDto(this Cliente clienteDto) {
            return new ClienteDto {
                Cpf = clienteDto.Cpf,
                DataNascimento = clienteDto.DataNascimento,
                Nome = clienteDto.Nome,
                Observacao = clienteDto.Observacao,
                Telefone = clienteDto.Telefone
            };
        }
    }
}