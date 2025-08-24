using FluentResults;
using Microsoft.EntityFrameworkCore;
using ZapAgenda_api_aspnet.data;
//todo: tirar essa merda de repositorio genérico
namespace ZapAgenda_api_aspnet.repositories.generic
{
    public class Repository<T> : IRepository<T> where T : class
    {
        protected internal readonly CoreDBContext _context;
        private readonly DbSet<T> _dbSet;
        public Repository(CoreDBContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }


        public async Task<Result<T>> GetByIdAsync(int id)
        {
            var dado = await _dbSet.FindAsync(id);
            if (dado == null)
            {
                return Result.Fail($"Não existe dado com o id:{id}");
            }
            return Result.Ok(dado);
        }
        public async Task<T> CreateAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<List<T>?> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        public async Task<Result<T>> DeleteAsync(int id)
        {
            var modelo = await _dbSet.FindAsync(id);
            if (modelo == null)
            {
                return Result.Fail($"Não existe empresa do id: {id}");
            }
            _dbSet.Remove(modelo);
            await _context.SaveChangesAsync();
            return Result.Ok(modelo);
        }

        public async Task UpdateAsync(T entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<Result<T>> GetByGuidAsync(Guid id)
        {
            var dado = await _dbSet.FindAsync(id);
            if (dado == null)
            {
                return Result.Fail($"Não existe dado com o id:{id}");
            }
            return Result.Ok(dado);
        }

        public async Task<T?> DeleteAsync(Guid id)
        {
            var modelo = await _dbSet.FindAsync(id);
            if (modelo == null)
            {
                return null;
            }
            _dbSet.Remove(modelo);
            await _context.SaveChangesAsync();
            return modelo;
        }
    }
}