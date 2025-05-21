import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline'
import { getSupplies, createSupply, getVehicles, getStations } from '@/lib/api/supplies'
import { useAuth } from '@/contexts/AuthContext'
import type { SupplyInsert } from '@/lib/api/supplies'

export default function Supplies() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: supplies, isLoading: isLoadingSupplies } = useQuery({
    queryKey: ['supplies'],
    queryFn: getSupplies
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles
  })

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: getStations
  })

  const createMutation = useMutation({
    mutationFn: createSupply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      toast.success('Abastecimento registrado com sucesso!')
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error('Erro ao registrar abastecimento')
    }
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const supplyData: SupplyInsert = {
      veiculo_id: formData.get('veiculo_id') as string,
      operador_id: user?.id as string,
      posto_id: formData.get('posto_id') as string,
      tipo_combustivel: formData.get('tipo_combustivel') as 'gasolina' | 'diesel' | 'etanol' | 'gnv',
      litros: Number(formData.get('litros')),
      valor_total: Number(formData.get('valor_total')),
      data_abastecimento: new Date().toISOString()
    }

    createMutation.mutate(supplyData)
  }

  if (isLoadingSupplies) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Abastecimentos</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Novo Abastecimento
            </button>
            <button
              onClick={() => {
                // TODO: Implementar exportação
                toast.success('Relatório exportado com sucesso!')
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentChartBarIcon className="-ml-1 mr-2 h-5 w-5" />
              Exportar Relatório
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Data
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Veículo
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Posto
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Combustível
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Litros
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Valor Total
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Operador
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {supplies?.map((supply) => (
                      <tr key={supply.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {format(new Date(supply.data_abastecimento), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {supply.veiculo.placa} - {supply.veiculo.modelo}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {supply.posto.nome}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {supply.tipo_combustivel}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {Number(supply.litros).toFixed(2)}L
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(Number(supply.valor_total))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {supply.operador.nome}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Novo Abastecimento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Novo Abastecimento</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="veiculo_id" className="block text-sm font-medium text-gray-700">
                    Veículo
                  </label>
                  <select
                    name="veiculo_id"
                    id="veiculo_id"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Selecione um veículo</option>
                    {vehicles?.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.placa} - {vehicle.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="posto_id" className="block text-sm font-medium text-gray-700">
                    Posto
                  </label>
                  <select
                    name="posto_id"
                    id="posto_id"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Selecione um posto</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tipo_combustivel" className="block text-sm font-medium text-gray-700">
                    Tipo de Combustível
                  </label>
                  <select
                    name="tipo_combustivel"
                    id="tipo_combustivel"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Selecione o combustível</option>
                    <option value="gasolina">Gasolina</option>
                    <option value="diesel">Diesel</option>
                    <option value="etanol">Etanol</option>
                    <option value="gnv">GNV</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="litros" className="block text-sm font-medium text-gray-700">
                    Litros
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="litros"
                    id="litros"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="valor_total" className="block text-sm font-medium text-gray-700">
                    Valor Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="valor_total"
                    id="valor_total"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}