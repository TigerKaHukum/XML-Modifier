document.getElementById('processBtn').addEventListener('click', () => {
    const fileInput = document.getElementById('xmlFile');
    const typeInput = document.getElementById('typeInput').value.trim();
    const subtypeInput = document.getElementById('subtypeInput').value.trim();
    const tradingPartnersInput = document.getElementById('tradingPartnersInput').value.trim();

    if (fileInput.files.length === 0) {
        alert("Please upload an XML file first.");
        return;
    }

    if (!typeInput || !subtypeInput || !tradingPartnersInput) {
        alert("Please provide Type, Subtype, and Trading Partners.");
        return;
    }

    const tradingPartners = tradingPartnersInput.split(',').map(tp => tp.trim());

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const xmlData = event.target.result;
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(xmlData, "application/xml");

        // Create a new ZIP archive
        let zip = new JSZip();
        tradingPartners.forEach(tradingPartner => {
            const modifiedXML = modifyXML(xmlDoc.cloneNode(true), typeInput, subtypeInput, tradingPartner);
            // Update file name to Type_SubType_TradingPartner
            const fileName = `${typeInput}_${subtypeInput}_${tradingPartner}.xml`;
            zip.file(fileName, modifiedXML);
        });

        // Generate ZIP file and trigger download
        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                const zipFileName = `${typeInput}_${subtypeInput}.zip`;
                const link = document.createElement("a");
                link.href = URL.createObjectURL(content);
                link.download = zipFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
    };

    reader.readAsText(file);
});

function modifyXML(xmlDoc, type, subtype, tradingPartner) {
    // Update Header fields
    const header = xmlDoc.getElementsByTagName('Header')[0];
    if (header) {
        header.getElementsByTagName('Type')[0].textContent = type;
        header.getElementsByTagName('Subtype')[0].textContent = subtype;
        header.getElementsByTagName('TradingPartner')[0].textContent = tradingPartner;
        header.getElementsByTagName('Filename')[0].textContent = `${type}_${subtype}_${tradingPartner}`;
    }

    // Concatenate with spaces between the elements
    const concatValue = `${tradingPartner} ${type} ${subtype}`;

    // Nodes to modify by replacing their content, excluding 'CustomerItemNumber'
    const nodesToModify = [
        'Supplier/Address/Name',
        'Receiver/Address/Name',
        'ItemDescription',
        'BatchNumber'
    ];

    nodesToModify.forEach(nodePath => {
        const nodes = getNodesByPath(xmlDoc, nodePath);
        nodes.forEach(node => {
            // Modify only nodes without a 'type' attribute
            if (!node.hasAttribute('type')) {
                node.textContent = concatValue;
            }
        });
    });

    return new XMLSerializer().serializeToString(xmlDoc);
}

// Helper function to get nodes by path (for nested elements like 'Supplier/Address/Name')
function getNodesByPath(xmlDoc, path) {
    const parts = path.split('/');
    let elements = [xmlDoc];
    
    parts.forEach(part => {
        elements = elements.reduce((acc, el) => {
            const found = Array.from(el.getElementsByTagName(part));
            return acc.concat(found);
        }, []);
    });

    return elements;
}
