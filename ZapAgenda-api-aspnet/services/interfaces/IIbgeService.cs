using FluentResults;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.interfaces
{
    public interface IIbgeService
    {
        Task<Result<List<Estado>?>> GetAllEstados();
        Task<Result<List<Municipio>>> GetMunicipiosBySigla(string sigla);
        Task<Result<bool>> SeMunicipioExiste(string NomeMunicipio, string sigla);
        Task<List<Municipio>?> GetMunicipiosByNome(string NomeMunicipio);
        Task<Result<Municipio>> GetMunicipio(string NomeMunicipio, string sigla);
        Task<Result<CepDados>> GetCepDados (string cep);
        Task<Result<bool>> SeMunicipioPertenceCep (string NomeMunicipio, string Sigla, string Cep);
    }
}