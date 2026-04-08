import {
    Html,
    Head,
    Body,
    Container,
    Text,
    Img,
    Section,
    Row,
    Column,
    Hr,
} from '@react-email/components';

export interface ReceiptEmailProps {
    orderId: string;
    items: Array<{
        name: string;
        details: string;
        quantity: number;
        price: number;
        image: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    customerName: string;
    address: string;
}

export const ReceiptEmail = ({
    orderId,
    items,
    subtotal,
    shipping,
    total,
    customerName,
    address,
}: ReceiptEmailProps) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Text style={logo}>GRAIN SHOP</Text>

                    <Text style={orderNumber}>Order {orderId}</Text>
                    <Text style={heading}>Thanks for your purchase!</Text>
                    <Text style={subheading}>
                        We're getting your order ready and we'll notify you when it's shipped.
                    </Text>

                    <Section style={tableHeader}>
                        <Row>
                            <Column style={{ width: '60%' }}>
                                <Text style={tableHeaderText}>Items</Text>
                            </Column>
                            <Column style={{ width: '20%', textAlign: 'right' }}>
                                <Text style={tableHeaderText}>Qty</Text>
                            </Column>
                            <Column style={{ width: '20%', textAlign: 'right' }}>
                                <Text style={tableHeaderText}>Price</Text>
                            </Column>
                        </Row>
                    </Section>
                    <Hr style={hr} />

                    {items.map((item, index) => (
                        <Section key={index} style={itemRow}>
                            <Row>
                                <Column style={{ width: '20%' }}>
                                    <Img src={item.image} width="60" height="60" style={productImage} alt={item.name} />
                                </Column>
                                <Column style={{ width: '40%', paddingLeft: '15px' }}>
                                    <Text style={itemName}>{item.name}</Text>
                                    <Text style={itemDetails}>{item.details}</Text>
                                </Column>
                                <Column style={{ width: '20%', textAlign: 'right' }}>
                                    <Text style={itemText}>{item.quantity}</Text>
                                </Column>
                                <Column style={{ width: '20%', textAlign: 'right' }}>
                                    <Text style={itemText}>{item.price.toFixed(2)} ₴</Text>
                                </Column>
                            </Row>
                        </Section>
                    ))}
                    <Hr style={hr} />

                    <Section style={totalsSection}>
                        <Row style={totalRow}>
                            <Column><Text style={itemText}>Subtotal</Text></Column>
                            <Column style={{ textAlign: 'right' }}><Text style={itemText}>{subtotal.toFixed(2)} ₴</Text></Column>
                        </Row>
                        <Row style={totalRow}>
                            <Column><Text style={itemText}>Shipping</Text></Column>
                            <Column style={{ textAlign: 'right' }}><Text style={itemText}>{shipping.toFixed(2)} ₴</Text></Column>
                        </Row>
                        <Row style={{ marginTop: '10px' }}>
                            <Column><Text style={totalText}>Total</Text></Column>
                            <Column style={{ textAlign: 'right' }}><Text style={totalText}>UAH {total.toFixed(2)}</Text></Column>
                        </Row>
                    </Section>

                    <Section style={addressSection}>
                        <Text style={addressTitle}>Shipping & Billing</Text>
                        <Text style={addressText}>{customerName}</Text>
                        <Text style={addressText}>{address}</Text>
                    </Section>

                </Container>
            </Body>
        </Html>
    );
};

const main = { backgroundColor: '#ffffff', fontFamily: 'HelveticaNeue, Helvetica, Arial, sans-serif' };
const container = { maxWidth: '600px', margin: '0 auto', padding: '40px 20px' };
const logo = { fontSize: '24px', fontWeight: '400', letterSpacing: '2px', textAlign: 'center' as const, margin: '0 0 50px' };
const orderNumber = { fontSize: '12px', color: '#888', margin: '0 0 5px' };
const heading = { fontSize: '22px', fontWeight: '400', margin: '0 0 10px' };
const subheading = { fontSize: '14px', color: '#666', margin: '0 0 40px' };
const tableHeader = { marginBottom: '10px' };
const tableHeaderText = { fontSize: '13px', fontWeight: '600', color: '#333', margin: '0' };
const hr = { borderColor: '#eeeeee', margin: '15px 0' };
const itemRow = { marginBottom: '15px' };
const productImage = { borderRadius: '4px', border: '1px solid #f0f0f0' };
const itemName = { fontSize: '14px', fontWeight: '600', margin: '0 0 4px' };
const itemDetails = { fontSize: '13px', color: '#888', margin: '0' };
const itemText = { fontSize: '14px', margin: '0', color: '#333' };
const totalsSection = { marginTop: '20px', marginBottom: '40px' };
const totalRow = { marginBottom: '10px' };
const totalText = { fontSize: '16px', fontWeight: '600', margin: '0', color: '#111' };
const addressSection = { marginTop: '20px' };
const addressTitle = { fontSize: '14px', fontWeight: '600', margin: '0 0 10px' };
const addressText = { fontSize: '13px', color: '#666', lineHeight: '1.5', margin: '0' };
