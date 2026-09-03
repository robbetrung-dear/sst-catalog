import React from 'react';
import { CartItem } from '../context/CatalogContext';

interface InvoiceTemplateProps {
  cart: CartItem[];
  customerName: string;
  customerAddress: string;
  customerCode: string; // The orderNotes/Pelanggan Tunai field
  totalPrice: number;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ cart, customerName, customerAddress, customerCode, totalPrice }, ref) => {
    // Generate Invoice Number: [kode pelanggan]/Tahun[YYYY]/bulan[MM]/tanggal[DD]/jam[hh]/menit[mm]
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    
    // Fallback code if 'Pelanggan Tunai' or empty
    const kode = (customerCode && customerCode !== 'Pelanggan Tunai') ? customerCode : 'TUNAI';
    const invoiceNumber = `${kode}/${yyyy}/${mm}/${dd}/${hh}/${min}`;
    const dateFormatted = `${dd}/${mm}/${yyyy}`;
    
    const tax = totalPrice * 0.11;

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-8 font-sans w-[800px]"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-sm space-y-1 w-2/3">
            <div className="flex">
              <span className="font-bold w-24 shrink-0">No. INV.</span>
              <span className="font-bold mr-2">:</span>
              <span>{invoiceNumber}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 shrink-0">Yth. Kpd.</span>
              <span className="font-bold mr-2">:</span>
              <span>{customerName}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 shrink-0">Alamat</span>
              <span className="font-bold mr-2">:</span>
              <span>{customerAddress}</span>
            </div>
          </div>
          <div className="w-1/3 flex justify-end">
            <div className="text-[#8B5A2B] font-black text-5xl tracking-tighter" style={{ fontFamily: 'serif' }}>
              SST
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-1 px-2 text-left border border-gray-300 w-10">No.</th>
              <th className="py-1 px-2 text-left border border-gray-300">SST DO (DELIVERY ORDER) & INVOICE</th>
              <th className="py-1 px-2 text-center border border-gray-300 w-16">Jumlah</th>
              <th className="py-1 px-2 text-right border border-gray-300 w-28">Harga</th>
              <th className="py-1 px-2 text-center border border-gray-300 w-16">Disc.%</th>
              <th className="py-1 px-2 text-right border border-gray-300 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => {
              const hasDiscount = item.product.harga_diskon && item.product.harga_diskon < item.product.harga;
              const activePrice = hasDiscount ? item.product.harga_diskon! : item.product.harga;
              const lineTotal = activePrice * item.quantity;
              
              // Calculate discount percentage if needed
              let discPercent = 0;
              if (hasDiscount && item.product.harga > 0) {
                 discPercent = Math.round(((item.product.harga - activePrice) / item.product.harga) * 100);
              }

              return (
                <tr key={item.product.id}>
                  <td className="py-1 px-2 text-center border border-gray-300">{index + 1}</td>
                  <td className="py-1 px-2 text-left border border-gray-300 uppercase">{item.product.nama}</td>
                  <td className="py-1 px-2 text-center border border-gray-300">{item.quantity}</td>
                  <td className="py-1 px-2 text-right border border-gray-300">
                    {activePrice.toLocaleString('id-ID')}
                  </td>
                  <td className="py-1 px-2 text-center border border-gray-300">
                    {discPercent > 0 ? discPercent : ''}
                  </td>
                  <td className="py-1 px-2 text-right border border-gray-300">
                    {lineTotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-between items-start text-sm">
          {/* Signatures */}
          <div className="w-1/2 mt-8">
            <div className="mb-2">
              <span className="font-bold mr-2">Tanggal:</span> 
              <span>{dateFormatted}</span>
            </div>
            <div className="flex justify-between w-full mt-4 pr-12 text-center">
              <div>
                <p>Disetujui,</p>
                <div className="h-20"></div>
                <p>(Admin)</p>
              </div>
              <div>
                <p>Diorder oleh,</p>
                <div className="h-20"></div>
                <p>({customerName || '....................'})</p>
              </div>
            </div>
          </div>
          
          {/* Summary Box */}
          <div className="w-1/2 flex flex-col items-end">
            <div className="flex w-full bg-gray-200 font-bold py-1 px-2 border border-gray-300 mb-2">
              <div className="flex-1 text-right pr-4">Jumlah Total PO :</div>
              <div className="w-32 text-right">{totalPrice.toLocaleString('id-ID')}</div>
            </div>
            
            <table className="w-64 border border-gray-300 text-right">
              <tbody>
                <tr>
                  <td className="py-1 px-2 border border-gray-300 border-b-0 text-left">Diskon Akhir</td>
                  <td className="py-1 px-2 border border-gray-300 border-b-0">0</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 border border-gray-300 border-b-0 text-left">Tax Rate</td>
                  <td className="py-1 px-2 border border-gray-300 border-b-0">11%</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 border border-gray-300 border-b-0 text-left">Tax</td>
                  <td className="py-1 px-2 border border-gray-300 border-b-0">
                    {tax.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 px-2 border border-gray-300 border-b-0 text-left">Biaya / Lain-lain</td>
                  <td className="py-1 px-2 border border-gray-300 border-b-0">0</td>
                </tr>
                <tr className="bg-gray-300 font-bold">
                  <td className="py-1 px-2 border border-gray-300 text-left">TOTAL</td>
                  <td className="py-1 px-2 border border-gray-300">{totalPrice.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
);
