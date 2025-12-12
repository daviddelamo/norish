# Norish Recipe API Documentation

REST API for accessing recipes programmatically. Designed for mobile apps, iOS Shortcuts, and third-party integrations.

## Base URL

```
https://norishv2.damaleia.com
```

## Authentication

All requests require an API key passed in the `x-api-key` header.

### Getting an API Key

1. Log into the Norish web interface
2. Go to **Settings → User → API Keys**
3. Click **Create Key** and save the generated key securely

### Request Header

```
x-api-key: YOUR_API_KEY
```

---

## Endpoints

### List Recipes

```http
GET /api/recipes
```

Returns a paginated list of recipes.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of recipes to return (max: 100) |
| `cursor` | integer | 0 | Pagination offset |
| `search` | string | - | Filter by recipe name (partial match) |
| `tags` | string | - | Comma-separated tag names |
| `filterMode` | string | "OR" | Tag filter mode: `OR` or `AND` |
| `sortMode` | string | "dateDesc" | Sort order: `dateDesc`, `dateAsc`, `titleAsc`, `titleDesc` |

#### Example Request

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://norishv2.damaleia.com/api/recipes?limit=20&search=pasta"
```

#### Example Response

```json
{
  "recipes": [
    {
      "id": "5d55d6c5-2217-5e86-996a-4ee572665525",
      "userId": "user-123",
      "name": "Spaghetti Carbonara",
      "description": "Classic Italian pasta dish",
      "image": "/recipes/images/5d55d6c5-2217-5e86-996a-4ee572665525.jpg",
      "url": "https://example.com/recipe",
      "servings": 4,
      "prepMinutes": 15,
      "cookMinutes": 20,
      "totalMinutes": 35,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z",
      "tags": [
        { "name": "pasta" },
        { "name": "italian" }
      ]
    }
  ],
  "total": 42,
  "nextCursor": 20
}
```

---

### Get Single Recipe

```http
GET /api/recipes?id={recipeId}
```

Returns a single recipe with full details including ingredients and steps.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Recipe ID |

#### Example Request

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://norishv2.damaleia.com/api/recipes?id=5d55d6c5-2217-5e86-996a-4ee572665525"
```

#### Example Response

```json
{
  "id": "5d55d6c5-2217-5e86-996a-4ee572665525",
  "userId": "user-123",
  "name": "Spaghetti Carbonara",
  "description": "Classic Italian pasta dish with eggs, cheese, and pancetta",
  "image": "/recipes/images/5d55d6c5-2217-5e86-996a-4ee572665525.jpg",
  "url": "https://example.com/recipe",
  "servings": 4,
  "prepMinutes": 15,
  "cookMinutes": 20,
  "totalMinutes": 35,
  "systemUsed": "metric",
  "createdAt": "2024-12-01T10:00:00.000Z",
  "updatedAt": "2024-12-01T10:00:00.000Z",
  "tags": [
    { "name": "pasta" },
    { "name": "italian" },
    { "name": "quick" }
  ],
  "recipeIngredients": [
    {
      "ingredientId": "ing-001",
      "ingredientName": "Spaghetti",
      "amount": 400,
      "unit": "g",
      "systemUsed": "metric",
      "order": 0
    },
    {
      "ingredientId": "ing-002",
      "ingredientName": "Eggs",
      "amount": 4,
      "unit": null,
      "systemUsed": "metric",
      "order": 1
    },
    {
      "ingredientId": "ing-003",
      "ingredientName": "Pecorino Romano",
      "amount": 100,
      "unit": "g",
      "systemUsed": "metric",
      "order": 2
    }
  ],
  "steps": [
    {
      "step": "Bring a large pot of salted water to boil and cook spaghetti according to package directions.",
      "systemUsed": "metric",
      "order": 0
    },
    {
      "step": "While pasta cooks, whisk eggs with grated cheese in a bowl.",
      "systemUsed": "metric",
      "order": 1
    },
    {
      "step": "Drain pasta, reserving 1 cup cooking water. Toss hot pasta with egg mixture off heat.",
      "systemUsed": "metric",
      "order": 2
    }
  ],
  "author": {
    "id": "user-123",
    "name": "Chef John",
    "image": null
  }
}
```

---

## Error Responses

### 401 Unauthorized

Missing or invalid API key.

```json
{ "error": "Unauthorized" }
```

### 403 Forbidden

Valid API key but no permission to access the resource.

```json
{ "error": "Access denied" }
```

### 404 Not Found

Recipe ID does not exist.

```json
{ "error": "Recipe not found" }
```

### 500 Internal Server Error

Server-side error.

```json
{ "error": "Internal server error" }
```

---

## Data Types

### Recipe (List Item)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique recipe identifier |
| `userId` | string | Owner's user ID |
| `name` | string | Recipe name |
| `description` | string \| null | Recipe description |
| `image` | string \| null | Relative path to recipe image |
| `url` | string \| null | Source URL if imported |
| `servings` | integer | Number of servings |
| `prepMinutes` | integer \| null | Preparation time in minutes |
| `cookMinutes` | integer \| null | Cooking time in minutes |
| `totalMinutes` | integer \| null | Total time in minutes |
| `createdAt` | ISO 8601 | Creation timestamp |
| `updatedAt` | ISO 8601 | Last update timestamp |
| `tags` | array | List of tag objects |

### Recipe (Full Detail)

Includes all fields from list item, plus:

| Field | Type | Description |
|-------|------|-------------|
| `systemUsed` | string | Measurement system: `metric` or `us` |
| `recipeIngredients` | array | List of ingredients |
| `steps` | array | List of cooking steps |
| `author` | object | Author information |

### Ingredient

| Field | Type | Description |
|-------|------|-------------|
| `ingredientId` | UUID | Ingredient reference ID |
| `ingredientName` | string | Ingredient name |
| `amount` | number \| null | Quantity |
| `unit` | string \| null | Unit of measurement |
| `systemUsed` | string | `metric` or `us` |
| `order` | number | Display order |

### Step

| Field | Type | Description |
|-------|------|-------------|
| `step` | string | Step instructions |
| `systemUsed` | string | `metric` or `us` |
| `order` | number | Step number |

---

## Pagination

The API uses cursor-based pagination:

- `cursor`: The offset to start from (default: 0)
- `limit`: Number of items per page (default: 50, max: 100)
- `nextCursor`: The cursor for the next page, or `null` if no more pages

### Example: Fetching All Recipes

```javascript
async function fetchAllRecipes(apiKey) {
  const recipes = [];
  let cursor = 0;
  
  while (true) {
    const response = await fetch(
      `https://norishv2.damaleia.com/api/recipes?cursor=${cursor}&limit=50`,
      { headers: { "x-api-key": apiKey } }
    );
    const data = await response.json();
    
    recipes.push(...data.recipes);
    
    if (data.nextCursor === null) break;
    cursor = data.nextCursor;
  }
  
  return recipes;
}
```

---

## Rate Limiting

Currently no rate limiting is enforced, but clients should implement reasonable backoff to avoid overloading the server.

---

## Images

Recipe images are served at:

```
https://norishv2.damaleia.com{image_path}
```

For example, if `image` is `/recipes/images/abc123.jpg`:

```
https://norishv2.damaleia.com/recipes/images/abc123.jpg
```
