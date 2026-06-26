const e = React.createElement;

function App() {
    const [role, setRole]       = React.useState("user");
    const [account, setAccount] = React.useState(null);
    const [vehicles, setVehicles] = React.useState([]);
    const [message, setMessage] = React.useState("");
    const [query, setQuery]     = React.useState("");

    React.useEffect(() => { loadVehicles(); }, []);

    async function api(path, options) {
        const response = await fetch(path, {
            headers: { "Content-Type": "application/json" },
            ...options
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed");
        return data;
    }

    async function loadVehicles(searchText = "") {
        const data = await api("/api/events?q=" + encodeURIComponent(searchText));
        setVehicles(data);
        if (data.length === 0) setMessage("No matching vehicles found. Try a different search.");
    }

    function submitAuth(ev, mode) {
        ev.preventDefault();
        const payload = Object.fromEntries(new FormData(ev.currentTarget).entries());
        const prefix = role === "user" ? "/api/auth/user/" : "/api/auth/organizer/";
        api(prefix + mode, { method: "POST", body: JSON.stringify(payload) })
            .then(data => {
                setAccount(data);
                setMessage(mode === "register" ? "Registration successful!" : "Login successful!");
            })
            .catch(err => setMessage(err.message));
    }

    function listVehicle(ev) {
        ev.preventDefault();
        const payload = Object.fromEntries(new FormData(ev.currentTarget).entries());
        payload.organizerId = String(account.id);
        api("/api/events", { method: "POST", body: JSON.stringify(payload) })
            .then(created => {
                setMessage("Vehicle listed successfully!");
                setVehicles(items => [created, ...items]);
                ev.currentTarget.reset();
            })
            .catch(err => setMessage(err.message));
    }

    function book(vehicleId, days) {
        if (!account || account.role !== "USER") {
            setMessage("Please sign in as a renter before booking.");
            return;
        }
        api("/api/bookings", {
            method: "POST",
            body: JSON.stringify({ userId: String(account.id), eventId: String(vehicleId), quantity: String(days) })
        })
            .then(data => {
                setMessage("Rental confirmed! Booking Ref: " + data.ticketId);
                loadVehicles(query);
            })
            .catch(err => setMessage(err.message));
    }

    return e("div", { className: "shell" },
        e("header", { className: "topbar" },
            e("div", { className: "brand" }, "🚗 VehicleRent"),
            e("div", { className: "tabs" },
                e("button", { className: role === "user"      ? "" : "secondary", onClick: () => setRole("user") },      "Renter"),
                e("button", { className: role === "organizer" ? "" : "secondary", onClick: () => setRole("organizer") }, "Fleet Owner")
            )
        ),
        account && e("p", { className: "muted" }, "Signed in as " + account.name + " (" + (account.role === "ORGANIZER" ? "Fleet Owner" : "Renter") + ")"),
        message  && e("div", { className: "alert" }, message),
        e("section", { className: "grid" },
            e(AuthPanel,   { role, onSubmit: submitAuth }),
            account && account.role === "ORGANIZER" && e(VehicleForm, { onSubmit: listVehicle }),
            e(SearchPanel, { query, setQuery, onSearch: loadVehicles })
        ),
        e("section", { className: "grid", style: { marginTop: "16px" } },
            vehicles.map(item => e(VehicleCard, { key: item.id, vehicle: item, onBook: book }))
        )
    );
}

function AuthPanel({ role, onSubmit }) {
    const isUser = role === "user";
    return e("div", { className: "panel" },
        e("h2", null, isUser ? "Renter Account" : "Fleet Owner Account"),
        e("form", { className: "form", onSubmit: ev => onSubmit(ev, "register") },
            e("input", { name: isUser ? "name" : "organizerName",    placeholder: isUser ? "Full Name" : "Owner Name", required: true }),
            !isUser && e("input", { name: "organizationName", placeholder: "Fleet / Company Name", required: true }),
            e("input", { name: "email",    type: "email",    placeholder: "Email Address", required: true }),
            e("input", { name: "password", type: "password", placeholder: "Password",       required: true }),
            e("input", { name: "phone",    placeholder: "Phone Number" }),
            e("input", { name: "address",  placeholder: "Address" }),
            isUser && e("input", { name: "dateOfBirth", type: "date" }),
            isUser && e("select", { name: "gender" },
                e("option", { value: "" },        "Gender"),
                e("option", { value: "Female" },  "Female"),
                e("option", { value: "Male" },    "Male"),
                e("option", { value: "Other" },   "Other")
            ),
            e("button", null, "Register")
        ),
        e("form", { className: "form", style: { marginTop: "14px" }, onSubmit: ev => onSubmit(ev, "login") },
            e("input", { name: "email",    type: "email",    placeholder: "Email Address", required: true }),
            e("input", { name: "password", type: "password", placeholder: "Password",       required: true }),
            e("button", { className: "secondary" }, "Sign In")
        )
    );
}

function VehicleForm({ onSubmit }) {
    return e("div", { className: "panel" },
        e("h2", null, "List a Vehicle"),
        e("form", { className: "form", onSubmit },
            e("input",    { name: "eventName",    placeholder: "Vehicle Title (e.g. Toyota Innova 2023)", required: true }),
            e("textarea", { name: "description",  placeholder: "Vehicle description, condition, features" }),
            e("input",    { name: "eventDate",    type: "date", required: true }),
            e("input",    { name: "eventTime",    type: "time", required: true }),
            e("input",    { name: "eventType",    placeholder: "Transmission (MANUAL / AUTOMATIC)", required: true }),
            e("input",    { name: "venueName",    placeholder: "Pickup Area" }),
            e("input",    { name: "location",     placeholder: "City / Full Location", required: true }),
            e("input",    { name: "ticketPrice",  type: "number", min: "0", step: "1",   placeholder: "Price per Day (Rs.)", required: true }),
            e("input",    { name: "availableSeats", type: "number", min: "1", placeholder: "Fleet Quantity", required: true }),
            e("button",   null, "List Vehicle")
        )
    );
}

function SearchPanel({ query, setQuery, onSearch }) {
    return e("div", { className: "panel" },
        e("h2", null, "Search Vehicles"),
        e("form", { className: "form", onSubmit: ev => { ev.preventDefault(); onSearch(query); } },
            e("input", { value: query, onChange: ev => setQuery(ev.target.value), placeholder: "Vehicle type, brand, location" }),
            e("button", null, "Search")
        )
    );
}

function VehicleCard({ vehicle, onBook }) {
    const [days, setDays] = React.useState(1);
    const pricePerDay     = Number(vehicle.ticketPrice) || 0;
    const total           = pricePerDay * days;

    return e("article", { className: "event" },
        e("h3",  null, vehicle.eventName),
        e("div", { className: "muted" }, (vehicle.eventType || "N/A") + " | " + (vehicle.collegeName || "") + " " + (vehicle.departmentName || "")),
        e("div", null, (vehicle.venueName || "") + " — " + (vehicle.location || "")),
        e("div", null, "Rs." + pricePerDay + "/day | Available units: " + vehicle.availableSeats),
        e("div", null,
            e("label", null, "Days: "),
            e("input", { type: "number", min: "1", max: "30", value: days, onChange: ev => setDays(ev.target.value), style: { width: "60px" } }),
            " → Total: Rs." + total
        ),
        e("button", { onClick: () => onBook(vehicle.id, days) }, "Rent Now")
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(e(App));
