export const printPage = () => {
  const style = document.createElement('style')
  style.innerHTML = `
    @media print { 
      [data-sidebar="sidebar"], header, nav, .print\\:hidden, [role="tablist"] { 
        display: none !important; 
      } 
      main, .flex-1, .print\\:w-full, .print\\:block { 
        width: 100% !important; 
        max-width: 100% !important; 
        margin: 0 !important; 
        padding: 0 !important; 
        border: none !important; 
        box-shadow: none !important; 
        overflow: visible !important;
      }
      body { 
        background: white !important; 
        color: black !important; 
      }
      * { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
      }
    }
  `
  document.head.appendChild(style)
  window.print()
  setTimeout(() => document.head.removeChild(style), 1000)
}
