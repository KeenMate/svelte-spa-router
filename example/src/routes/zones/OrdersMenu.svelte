<script>
let { params = {} } = $props()
</script>

<div class="zone-menu">
    <h3>Orders</h3>
    <nav>
        <ul>
            <li class="active">All Orders</li>
            <li>Pending</li>
            <li>Processing</li>
            <li>Shipped</li>
            <li>Delivered</li>
            <li>Cancelled</li>
            <li>Refunded</li>
        </ul>
    </nav>
    <div class="menu-footer">
        <button class="btn-primary">+ Create Order</button>
    </div>
</div>

<style>
.zone-menu {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.zone-menu h3 {
    margin: 0 0 1rem 0;
    color: #1a1a1a;
    font-size: 1.2rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #f97316;
}

.zone-menu nav {
    flex: 1;
}

.zone-menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.zone-menu li {
    padding: 0.75rem 1rem;
    margin: 0.25rem 0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
}

.zone-menu li:hover {
    background: #ffedd5;
    color: #f97316;
}

.zone-menu li.active {
    background: #f97316;
    color: white;
}

.menu-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
}

.btn-primary {
    width: 100%;
    padding: 0.75rem;
    background: #f97316;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-primary:hover {
    background: #ea580c;
}
</style>
