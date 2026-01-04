/**
 * Bitcoin QR Code Generation
 * Generates QR codes in BIP21 format for Bitcoin payments
 */

import QRCode from 'qrcode'
import { BitcoinNetwork } from './bitcoin-api'

/**
 * Generate BIP21 payment URL
 * Format: bitcoin:address?amount=0.001&label=Description
 * 
 * @param address Bitcoin address
 * @param amount Amount in BTC (optional)
 * @param label Payment label (optional)
 * @param message Payment message (optional)
 * @param network Network (mainnet or testnet)
 */
export function generateBIP21URL(
  address: string,
  options: {
    amount?: number // in BTC
    label?: string
    message?: string
    network?: BitcoinNetwork
  } = {}
): string {
  const { amount, label, message, network = 'testnet' } = options

  // BIP21 format: bitcoin:address?param1=value1&param2=value2
  const scheme = network === 'mainnet' ? 'bitcoin' : 'bitcoin'
  let url = `${scheme}:${address}`

  const params: string[] = []

  if (amount !== undefined && amount > 0) {
    params.push(`amount=${amount}`)
  }

  if (label) {
    params.push(`label=${encodeURIComponent(label)}`)
  }

  if (message) {
    params.push(`message=${encodeURIComponent(message)}`)
  }

  if (params.length > 0) {
    url += `?${params.join('&')}`
  }

  return url
}

/**
 * Generate QR code as data URL (for img src)
 */
export async function generateQRCodeDataURL(
  data: string,
  options: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
  } = {}
): Promise<string> {
  const { width = 256, margin = 2, color } = options

  try {
    const dataURL = await QRCode.toDataURL(data, {
      width,
      margin,
      color: color || {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })

    return dataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(
  data: string,
  options: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
  } = {}
): Promise<string> {
  const { width = 256, margin = 2, color } = options

  try {
    const svg = await QRCode.toString(data, {
      type: 'svg',
      width,
      margin,
      color: color || {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })

    return svg
  } catch (error) {
    console.error('Error generating QR code SVG:', error)
    throw new Error('Failed to generate QR code SVG')
  }
}

/**
 * Generate payment QR code (BIP21 format)
 */
export async function generatePaymentQRCode(
  address: string,
  amount: number, // in BTC
  options: {
    label?: string
    message?: string
    network?: BitcoinNetwork
    width?: number
    margin?: number
  } = {}
): Promise<string> {
  const paymentURL = generateBIP21URL(address, {
    amount,
    label: options.label,
    message: options.message,
    network: options.network,
  })

  return generateQRCodeDataURL(paymentURL, {
    width: options.width,
    margin: options.margin,
  })
}





