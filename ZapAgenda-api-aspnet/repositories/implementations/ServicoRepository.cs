using FluentResults;
using Microsoft.EntityFrameworkCore;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.Dtos.Servico;
using ZapAgenda_api_aspnet.models;
using ZapAgenda_api_aspnet.repositories.interfaces;

namespace ZapAgenda_api_aspnet.repositories.implementations
{
    public class ServicoRepository : IServicoRepository
    {
        private readonly CoreDBContext _context;
        public ServicoRepository(CoreDBContext context)
        {
            _context = context;
        }

        public async Task<Result<Servico>> CreateAsync(Servico servico, Guid IdEmpresa)
        {
            servico.IdEmpresa = IdEmpresa;
            await _context.AddAsync(servico);
            await _context.SaveChangesAsync();
            return Result.Ok(servico);
        }

        public async Task<Result<Servico>> DeleteAsync(int IdServico, Guid IdEmpresa)
        {
            var servico = await _context.Servico.FirstOrDefaultAsync(s => s.Id == IdServico && s.IdEmpresa == IdEmpresa);
            if (servico == null)
            {
                return Result.Fail($"Serviço com ID {IdServico} não encontrado para esta empresa.");
            }

            if (!servico.Status)
            {
                return Result.Fail("O serviço já está desativado.");
            }

            servico.Status = false;
            servico.UltimaModificacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Result.Ok(servico);
        }


        public async Task<Result<List<Servico>>> GetAllByEmpresa(Guid IdEmpresa)
        {
            var servicos = await _context.Servico.Where(servico => servico.IdEmpresa == IdEmpresa && servico.Status).ToListAsync();
            if (servicos == null)
            {
                return Result.Fail("Servicos estão null");
            }
            return Result.Ok(servicos);
        }

        public async Task<Result<Servico>> GetById(int IdServico, Guid IdEmpresa)
        {
            var servico = await _context.Servico.FirstOrDefaultAsync(servico => servico.Id == IdServico);
            if (servico == null)
            {
                return Result.Fail($"Não existe Serviço com id:{IdServico}");
            }
            if (servico.IdEmpresa != IdEmpresa)
            {
                return Result.Fail($"Serviço não pertence a empresa");
            }
            return Result.Ok(servico);
        }

        public async Task<Result<Servico>> UpdateAsync(UpdateServicoDto updateServicoDto, int IdServico, Guid IdEmpresa)
        {
            var servico = await _context.Servico.FindAsync(IdServico);
            if (servico == null)
            {
                return Result.Fail($"Não existe serviço de id{IdServico}");
            }
            servico.Descricao = updateServicoDto.Descricao;
            servico.TempoDuracao = updateServicoDto.TempoDuracao;
            servico.Valor = updateServicoDto.Valor;
            _context.Servico.Update(servico);
            await _context.SaveChangesAsync();
            return Result.Ok(servico);
        }
    }
}