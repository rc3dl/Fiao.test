import test from "node:test";
import assert from "node:assert/strict";
import { validateProfile, userToForm } from "../src/lib/settings.js";

test("conserva una dirección antigua como referencia", () => {
  const result = validateProfile({
    full_name: "Ana",
    store_name: "Tienda Ana",
    phone: "",
    ruc: "",
    address: "Av. Central, frente al parque",
  });

  assert.equal(result.error, undefined);
  const saved = JSON.parse(result.values.address.replace("FIAO_LOCATION_V1:", ""));
  assert.equal(saved.address_reference, "Av. Central, frente al parque");
});

test("guarda y recupera los componentes de la dirección de la tienda", () => {
  const result = validateProfile({
    full_name: "Ana",
    store_name: "Tienda Ana",
    phone: "",
    ruc: "",
    street: "Calle 50",
    corregimiento: "San Francisco",
    district: "Panamá",
    province: "Panamá",
    address_reference: "Local 12",
  });

  assert.equal(result.error, undefined);
  const form = userToForm({ address: result.values.address });
  assert.deepEqual(
    {
      street: form.street,
      corregimiento: form.corregimiento,
      district: form.district,
      province: form.province,
      address_reference: form.address_reference,
    },
    {
      street: "Calle 50",
      corregimiento: "San Francisco",
      district: "Panamá",
      province: "Panamá",
      address_reference: "Local 12",
    }
  );
});
