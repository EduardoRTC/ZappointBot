using FluentResults;
using Microsoft.EntityFrameworkCore;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.Dtos.Empresa;
using ZapAgenda_api_aspnet.helpers;
using ZapAgenda_api_aspnet.interfaces;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.generic;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.repositories.implementations
{
    public class EmpresaRepository : Repository<Empresa>, IEmpresaRepository
    {
        private readonly IIbgeService _ibgeservice;
        public EmpresaRepository(CoreDBContext context, IIbgeService ibgeService) : base(context)
        {
            _ibgeservice = ibgeService;
        }

        //todo: testar se está sendo feito a verificação de cep com a cidade
        //todo: Adicionar put para alterar status da empresa
        public new async Task<Empresa> CreateAsync(Empresa empresaModel)
        {
            var cidadeExiste = await _ibgeservice.SeMunicipioExiste(empresaModel.NomeMunicipio, empresaModel.Sigla);
            if (!cidadeExiste.Value)
            {
                throw new ArgumentException($"Município {empresaModel.NomeMunicipio} de sigla: {empresaModel.Sigla} não existe");
            }

            var municipioPertenceNoCep = await _ibgeservice.SeMunicipioPertenceCep(empresaModel.NomeMunicipio, empresaModel.Sigla, empresaModel.Cep);
            if (!municipioPertenceNoCep.Value)
            {
                throw new ArgumentException($"Município não pertence no cep");
            }

            var cnpjValidationResult = ValidaCnpj.Validar(empresaModel.Cnpj);
            if (cnpjValidationResult.IsFailed)
            {
                throw new ArgumentException(cnpjValidationResult.Errors.First().Message);
            }

            await _context.Empresa.AddAsync(empresaModel);
            await _context.SaveChangesAsync();
            return empresaModel;
        }

        public async Task<Result<Empresa>> GetById(Guid IdEmpresa)
        {
            var empresa = await _context.Empresa.FirstOrDefaultAsync(emp => emp.IdEmpresa == IdEmpresa);
            if (empresa == null)
            {
                return Result.Fail($"Não existe empresa de id {IdEmpresa}");
            }
            return Result.Ok(empresa);
        }

        public async Task<Result<Empresa>> UpdateAsync(UpdateEmpresaDto empresaDto, Guid id)
        {
            var empresa = await _context.Empresa.FindAsync(id);
            if (empresa == null)
            {
                return Result.Fail($"Não existe empresa de id: {id}");
            }

            var municipioExiste = await _ibgeservice.SeMunicipioExiste(empresaDto.NomeMunicipio, empresaDto.Sigla);
            if (!municipioExiste.Value)
            {
                throw new ArgumentException($"Município {empresaDto.NomeMunicipio} de sigla: {empresaDto.Sigla} não existe");
            }

            var municipioPertenceNoCep = await _ibgeservice.SeMunicipioPertenceCep(empresaDto.NomeMunicipio, empresaDto.Sigla, empresaDto.Cep);
            if (!municipioPertenceNoCep.Value)
            {
                throw new ArgumentException("Município não pertence ao CEP informado");
            }

            if (!string.IsNullOrEmpty(empresaDto.Cnpj))
            {
                var cnpjValidationResult = ValidaCnpj.Validar(empresaDto.Cnpj);
                if (cnpjValidationResult.IsFailed)
                {
                    return Result.Fail(cnpjValidationResult.Errors.First().Message);
                }
                empresa.Cnpj = empresaDto.Cnpj;
            }

            empresa.NomeFantasia = empresaDto.NomeFantasia ?? empresa.NomeFantasia;
            empresa.RazaoSocial = empresaDto.RazaoSocial ?? empresa.RazaoSocial;
            empresa.TipoEmpresa = empresaDto.TipoEmpresa;
            empresa.Email = empresaDto.Email ?? empresa.Email;
            empresa.Telefone = empresaDto.Telefone ?? empresa.Telefone;
            empresa.Cep = empresaDto.Cep ?? empresa.Cep;
            empresa.NomeMunicipio = empresaDto.NomeMunicipio ?? empresa.NomeMunicipio;
            empresa.Sigla = empresaDto.Sigla ?? empresa.Sigla;

            await _context.SaveChangesAsync();
            return Result.Ok(empresa);
        }

    }
}