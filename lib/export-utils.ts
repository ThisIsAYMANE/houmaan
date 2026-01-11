/**
 * Export Utilities for Admin Reports
 * 
 * Supports CSV and PDF exports for:
 * - Betting reports
 * - Casino analytics
 * - Financial reports
 * - User reports
 */

export interface ExportOptions {
  filename: string
  data: any[]
  columns: Array<{
    key: string
    label: string
    format?: (value: any) => string
  }>
}

/**
 * Export data to CSV
 */
export function exportToCSV(options: ExportOptions): void {
  const { filename, data, columns } = options

  // Create CSV headers
  const headers = columns.map(col => col.label).join(',')

  // Create CSV rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key]
      
      // Apply formatting if provided
      if (col.format) {
        value = col.format(value)
      }
      
      // Escape commas and quotes
      if (typeof value === 'string') {
        value = `"${value.replace(/"/g, '""')}"`
      }
      
      return value
    }).join(',')
  })

  // Combine headers and rows
  const csv = [headers, ...rows].join('\n')

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export data to JSON (for developer debugging)
 */
export function exportToJSON(filename: string, data: any): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Format currency for export
 */
export function formatCurrency(amount: number, currency: string = 'MAD'): string {
  return `${amount.toFixed(2)} ${currency}`
}

/**
 * Format date for export
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(base: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `${base}_${timestamp}`
}

/**
 * Export betting report
 */
export function exportBettingReport(bets: any[]): void {
  exportToCSV({
    filename: generateFilename('betting_report'),
    data: bets,
    columns: [
      { key: 'id', label: 'Bet ID' },
      { key: 'user_id', label: 'User ID' },
      { key: 'username', label: 'Username' },
      { key: 'bet_type', label: 'Type' },
      { key: 'amount', label: 'Amount', format: (v) => formatCurrency(v) },
      { key: 'odds', label: 'Odds', format: (v) => v.toFixed(2) },
      { key: 'potential_win', label: 'Potential Win', format: (v) => formatCurrency(v) },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Placed At', format: formatDate }
    ]
  })
}

/**
 * Export casino analytics
 */
export function exportCasinoReport(games: any[]): void {
  exportToCSV({
    filename: generateFilename('casino_report'),
    data: games,
    columns: [
      { key: 'title', label: 'Game' },
      { key: 'provider_name', label: 'Provider' },
      { key: 'sessions', label: 'Sessions' },
      { key: 'unique_players', label: 'Players' },
      { key: 'total_wagered', label: 'Wagered', format: (v) => formatCurrency(v) },
      { key: 'total_won', label: 'Won', format: (v) => formatCurrency(v) },
      { key: 'revenue', label: 'Revenue', format: (v) => formatCurrency(v) },
      { key: 'rtp', label: 'RTP', format: formatPercentage }
    ]
  })
}

/**
 * Export financial transactions
 */
export function exportTransactionsReport(transactions: any[]): void {
  exportToCSV({
    filename: generateFilename('transactions_report'),
    data: transactions,
    columns: [
      { key: 'id', label: 'Transaction ID' },
      { key: 'user_id', label: 'User ID' },
      { key: 'email', label: 'Email' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount', format: (v) => formatCurrency(v) },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date', format: formatDate }
    ]
  })
}

/**
 * Export users report
 */
export function exportUsersReport(users: any[]): void {
  exportToCSV({
    filename: generateFilename('users_report'),
    data: users,
    columns: [
      { key: 'id', label: 'User ID' },
      { key: 'email', label: 'Email' },
      { key: 'username', label: 'Username' },
      { key: 'tier', label: 'Tier' },
      { key: 'balance', label: 'Balance', format: (v) => formatCurrency(v || 0) },
      { key: 'total_deposits', label: 'Total Deposits', format: (v) => formatCurrency(v || 0) },
      { key: 'total_bets', label: 'Total Bets' },
      { key: 'created_at', label: 'Registered', format: formatDate }
    ]
  })
}



