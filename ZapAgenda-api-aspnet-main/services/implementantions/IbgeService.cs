using FluentResults;
using Newtonsoft.Json;
using ZapAgenda_api_aspnet.interfaces;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.services
{
    public class IbgeService : IIbgeService
    {
        private readonly HttpClient _httpClient;

        public IbgeService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }
        public async Task<Result<List<Estado>?>> GetAllEstados()
        {
            var resposta = await _httpClient.GetAsync("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
            if (!resposta.IsSuccessStatusCode)
            {
                return Result.Fail($"Não foi possível se comunicar com a api statusCode:{resposta.StatusCode}");
            }
            var estados = await resposta.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(estados))
            {
                return Result.Fail($"estados está vazio ou nulo");
            }
            var estadosDeserializados = JsonConvert.DeserializeObject<List<Estado>>(estados);
            if (estadosDeserializados == null || estadosDeserializados.Count == 0)
            {
                return Result.Fail($"Array de estados está vazia");
            }
            return estadosDeserializados;
        }

        public async Task<Result<List<Municipio>>> GetMunicipiosBySigla(string sigla)
        {
            var resposta = await _httpClient.GetAsync($"https://servicodados.ibge.gov.br/api/v1/localidades/estados/{sigla}/municipios");
            if (!resposta.IsSuccessStatusCode)
            {
                return Result.Fail($"Não foi possível se comunicar com a api statusCode:{resposta.StatusCode}");
            }

            var municipios = await resposta.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(municipios))
            {
                return Result.Fail($"Null ou Vazio:Não existe estado com a sigla: {sigla}");
            }
            var municipiosDeserializados = JsonConvert.DeserializeObject<List<Municipio>>(municipios);

            if (municipiosDeserializados == null)
            {
                return Result.Fail($"Erro ao deserializar municípios para a sigla: {sigla}");
            }

            if (municipiosDeserializados.Count == 0)
            {
                return Result.Fail($"Lista vazia:Não existem múnicipios para a sigla: {sigla}");
            }
            return Result.Ok(municipiosDeserializados);
        }
        public async Task<List<Municipio>?> GetMunicipiosByNome(string NomeMunicipio)
        {
            var resposta = await _httpClient.GetAsync($"https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{NomeMunicipio}");
            if (!resposta.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"Não existe município com o nome {NomeMunicipio}");
            }
            var municipios = await resposta.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(municipios))
            {
                throw new ArgumentException("Municípios estão null ou vazios");
            }
            return JsonConvert.DeserializeObject<List<Municipio>>(municipios);
        }

        public async Task<Result<Municipio>> GetMunicipio(string NomeMunicipio, string sigla)
        {
            var municipios = await GetMunicipiosBySigla(sigla);
            if (municipios.IsFailed)
            {
                return Result.Fail(municipios.Errors);
            }
            var municipioCorreto = municipios.Value.FirstOrDefault(municipio => municipio.NomeMunicipio == NomeMunicipio);
            if (municipioCorreto == null)
            {
                return Result.Fail($"Não foi encontrado o município {NomeMunicipio} pro estado de sigla: {sigla}");
            }
            municipioCorreto.Sigla = sigla;
            return Result.Ok(municipioCorreto);
        }

        // todo: melhorar esse função que ela tá estupida, tá pegando todos municipios do estado e filtrando pra ver o certo pelo nome
        // Não consegui achar uma maneira de pegar todos com o mesmo nome e filtrar pela sigla sem ter que criar modelos novos de microregião etc
        public async Task<Result<bool>> SeMunicipioExiste(string NomeMunicipio, string sigla)
        {
            var municipios = await GetMunicipio(NomeMunicipio, sigla);
            if (municipios.IsFailed)
            {
                return Result.Fail(municipios.Errors);
            }
            return Result.Ok(true);
        }

        public async Task<Result<CepDados>> GetCepDados(string Cep)
        {
            var retornoCep = await _httpClient.GetAsync($"https://viacep.com.br/ws/{Cep}/json/");
            if (!retornoCep.IsSuccessStatusCode)
            {
                return Result.Fail("Não foi possível se comunicar com a api");
            }
            var cepDados = await retornoCep.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(cepDados))
            {
                return Result.Fail("Cep retornou nulo");
            }
            if (cepDados.Length == 0)
            {
                return Result.Fail("Cep retornou vazio");
            }
            var cepDadosDeserializado = JsonConvert.DeserializeObject<CepDados>(cepDados);
            if (cepDadosDeserializado == null)
            {
                return Result.Fail("Dados de cep estão vazios ao deserializar");
            }
            return Result.Ok(cepDadosDeserializado);
        }

        public async Task<Result<bool>> SeMunicipioPertenceCep(string NomeMunicipio, string Sigla, string Cep)
        {
            var municipioResultado = await GetMunicipio(NomeMunicipio, Sigla);
            if (municipioResultado.IsFailed)
            {
                return Result.Fail(municipioResultado.Errors);
            }
            var municipio = municipioResultado.Value;
            var cepDadosResultado = await GetCepDados(Cep);
            if (cepDadosResultado.IsFailed)
            {
                return Result.Fail(cepDadosResultado.Errors);
            }
            var cepDados = cepDadosResultado.Value;
            if (cepDados.CidadeCep != municipio.NomeMunicipio)
            {
                return Result.Fail("Nome da cidade não bate com a do Cep");
            }
            if(cepDados.SiglaCep != municipio.Sigla) {
                return Result.Fail("Estado diferente entre os dados do Cep e do municipio");
            }
            if (cepDados.IdMunicipioCep != municipio.IdMunicipio)
            {
                return Result.Fail("Id do ibge não bate ao verificar Cep");
            }
            return Result.Ok(true);
        }
    }
}