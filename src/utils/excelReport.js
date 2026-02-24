/**
 * Excel Report Generator — ExcelJS
 * 
 * Generates a professional two-sheet Excel report:
 * - Sheet 1: Dashboard Summary (KPIs, monthly revenue, top products)
 * - Sheet 2: Raw Data (full order list)
 */
import ExcelJS from 'exceljs'

// Brand palette
const BRAND = {
    primary: '1E3A5F',     // Lacivert
    primaryLight: 'EBF0F7', // Açık lacivert bg
    accent: '58A6FF',       // Mavi accent
    success: '3FB950',
    warning: 'F0B429',
    danger: 'E74C3C',
    white: 'FFFFFF',
    dark: '0D1117',
    gray: '8B949E',
    lightGray: 'F6F8FA',
    border: 'D0D7DE',
}

/** Header style — dark primary background, white bold text */
function headerStyle(ws, row, colCount) {
    for (let col = 1; col <= colCount; col++) {
        const cell = ws.getRow(row).getCell(col)
        cell.font = { bold: true, color: { argb: BRAND.white }, size: 11, name: 'Segoe UI' }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
            bottom: { style: 'thin', color: { argb: BRAND.border } },
        }
    }
}

/** Alternating row band (zebra) */
function zebraRow(ws, row, colCount, isEven) {
    if (!isEven) return
    for (let col = 1; col <= colCount; col++) {
        const cell = ws.getRow(row).getCell(col)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightGray } }
    }
}

/** KPI card style — highlights key metrics */
function kpiStyle(cell, { isBold = false, isValue = false } = {}) {
    cell.font = {
        bold: isBold,
        size: isValue ? 14 : 11,
        color: { argb: isValue ? BRAND.primary : BRAND.dark },
        name: 'Segoe UI',
    }
    cell.alignment = { vertical: 'middle', horizontal: isValue ? 'center' : 'left' }
}

/** Section title (merged, colored strip) */
function sectionTitle(ws, row, colCount, title) {
    ws.mergeCells(row, 1, row, colCount)
    const cell = ws.getRow(row).getCell(1)
    cell.value = title
    cell.font = { bold: true, size: 13, color: { argb: BRAND.primary }, name: 'Segoe UI' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primaryLight } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = {
        bottom: { style: 'medium', color: { argb: BRAND.accent } },
    }
    ws.getRow(row).height = 32
}

/**
 * Generate and download the Dashboard Excel report.
 * @param {Object} data - Report data
 * @param {Array} data.stats - KPI definitions [{label, value, change}]
 * @param {Array} data.recentOrders - Order rows
 * @param {Array} data.topProducts - Top products
 * @param {Array} data.months - Translated month names
 * @param {Array} data.chartData - Monthly revenue values
 * @param {Object} data.statusMap - Status key→label map
 * @param {Object} data.columns - Translated column headers
 * @param {string} data.sheetNames - { dashboard, rawData }
 * @param {string} data.titles - { kpi, monthly, topProducts, orders }
 */
export async function generateDashboardReport({
    stats,
    recentOrders,
    topProducts,
    months,
    chartData,
    statusMap,
    columns,
    sheetNames,
    titles,
}) {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Perdemo'
    wb.created = new Date()

    // ═══════════════════════════════════════════
    // SHEET 1: DASHBOARD SUMMARY
    // ═══════════════════════════════════════════
    const ws1 = wb.addWorksheet(sheetNames.dashboard, {
        properties: { tabColor: { argb: BRAND.accent } },
    })

    // --- Logo area ---
    ws1.mergeCells('A1', 'F1')
    const brandCell = ws1.getCell('A1')
    brandCell.value = '📊  PERDEMO — Dashboard Report'
    brandCell.font = { bold: true, size: 18, color: { argb: BRAND.primary }, name: 'Segoe UI' }
    brandCell.alignment = { vertical: 'middle', horizontal: 'left' }
    ws1.getRow(1).height = 44

    ws1.mergeCells('A2', 'F2')
    const dateCell = ws1.getCell('A2')
    dateCell.value = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
    dateCell.font = { size: 10, color: { argb: BRAND.gray }, name: 'Segoe UI' }
    ws1.getRow(2).height = 22

    // --- KPI Section ---
    let row = 4
    sectionTitle(ws1, row, 6, `📈  ${titles.kpi}`)
    row++

    // KPI headers
    ws1.getRow(row).values = [titles.kpiMetric, titles.kpiValue, titles.kpiChange]
    headerStyle(ws1, row, 3)
    row++

    stats.forEach((s, i) => {
        const r = ws1.getRow(row)
        r.values = [s.label, s.value, s.change]
        kpiStyle(r.getCell(1), { isBold: true })
        kpiStyle(r.getCell(2), { isValue: true })

        const changeCell = r.getCell(3)
        changeCell.font = {
            bold: true, size: 11, name: 'Segoe UI',
            color: { argb: s.positive ? BRAND.success : BRAND.danger },
        }
        changeCell.alignment = { vertical: 'middle', horizontal: 'center' }

        zebraRow(ws1, row, 3, i % 2 === 0)
        r.height = 28
        row++
    })

    // --- Monthly Revenue ---
    row += 1
    sectionTitle(ws1, row, 6, `📅  ${titles.monthly}`)
    row++

    ws1.getRow(row).values = [titles.month, titles.revenue]
    headerStyle(ws1, row, 2)
    row++

    months.forEach((m, i) => {
        const r = ws1.getRow(row)
        r.values = [m, `₺${chartData[i]}k`]
        r.getCell(1).font = { size: 11, name: 'Segoe UI' }
        r.getCell(2).font = { size: 11, name: 'Segoe UI', bold: true, color: { argb: BRAND.accent } }
        r.getCell(2).alignment = { horizontal: 'center' }
        zebraRow(ws1, row, 2, i % 2 === 0)
        row++
    })

    // --- Top Products ---
    row += 1
    sectionTitle(ws1, row, 6, `🏆  ${titles.topProducts}`)
    row++

    const prodHeaders = [titles.productName, titles.productSales, titles.productRevenue, titles.productTrend]
    ws1.getRow(row).values = prodHeaders
    headerStyle(ws1, row, 4)
    row++

    topProducts.forEach((p, i) => {
        const r = ws1.getRow(row)
        r.values = [p.name, p.sales, p.revenue, p.trend]
        r.getCell(1).font = { bold: true, size: 11, name: 'Segoe UI' }
        r.getCell(4).font = { bold: true, size: 11, name: 'Segoe UI', color: { argb: BRAND.success } }
        r.getCell(2).alignment = { horizontal: 'center' }
        r.getCell(3).alignment = { horizontal: 'center' }
        r.getCell(4).alignment = { horizontal: 'center' }
        zebraRow(ws1, row, 4, i % 2 === 0)
        row++
    })

    // Auto-fit columns
    ws1.columns = [
        { width: 28 },
        { width: 20 },
        { width: 18 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
    ]

    // ═══════════════════════════════════════════
    // SHEET 2: RAW DATA
    // ═══════════════════════════════════════════
    const ws2 = wb.addWorksheet(sheetNames.rawData, {
        properties: { tabColor: { argb: BRAND.success } },
    })

    // Title
    ws2.mergeCells('A1', 'F1')
    const rawTitle = ws2.getCell('A1')
    rawTitle.value = `📋  ${titles.orders}`
    rawTitle.font = { bold: true, size: 16, color: { argb: BRAND.primary }, name: 'Segoe UI' }
    rawTitle.alignment = { vertical: 'middle', horizontal: 'left' }
    ws2.getRow(1).height = 38

    // Headers
    const orderHeaders = [columns.id, columns.customer, columns.product, columns.amount, columns.status, columns.date]
    ws2.getRow(3).values = orderHeaders
    headerStyle(ws2, 3, 6)
    ws2.getRow(3).height = 28

    // Data rows
    recentOrders.forEach((o, i) => {
        const r = ws2.getRow(4 + i)
        const statusLabel = statusMap[o.status]?.label || o.status
        r.values = [o.id, o.customer, o.product, o.amount, statusLabel, o.date]

        // Style each cell
        r.eachCell((cell) => {
            cell.font = { size: 10.5, name: 'Segoe UI' }
            cell.alignment = { vertical: 'middle' }
            cell.border = {
                bottom: { style: 'thin', color: { argb: BRAND.border } },
            }
        })

        // Status color
        const statusCell = r.getCell(5)
        const statusColors = {
            pending: BRAND.warning,
            processing: BRAND.accent,
            shipped: 'BC8CFF',
            delivered: BRAND.success,
        }
        statusCell.font = {
            bold: true, size: 10.5, name: 'Segoe UI',
            color: { argb: statusColors[o.status] || BRAND.dark },
        }

        zebraRow(ws2, 4 + i, 6, i % 2 === 0)
        r.height = 26
    })

    // Auto-fit columns
    ws2.columns = [
        { width: 18 },  // ID
        { width: 22 },  // Customer
        { width: 30 },  // Product
        { width: 14 },  // Amount
        { width: 16 },  // Status
        { width: 16 },  // Date
    ]

    // ═══════════════════════════════════════════
    // DOWNLOAD
    // ═══════════════════════════════════════════
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Perdemo_Rapor_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
}
