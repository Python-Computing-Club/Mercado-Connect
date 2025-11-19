import jsPDF from "jspdf";

export default function emiteNFE(pedido, idPedido){
    const doc = new jsPDF();
    console.log(pedido);

    doc.setFontSize(16);
    doc.text("Nota Fiscal - Pedido #" + idPedido, 20, 20);

    doc.setFontSize(12);
    doc.text(`Cliente: ${pedido.nome_cliente}`, 20, 40);
    doc.text(`Data: ${pedido.data_pedido}`, 20, 50);
    doc.text(`Valor total: ${pedido.valor_total}`, 20, 60);

    doc.save(`nota-fiscal-${pedido.id}.pdf`);
}