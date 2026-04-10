# 🚀 Vector Calculus Visualizer

An interactive full-stack web application to visualize **Gradient, Curl, and Divergence** vector fields in real-time.

---

## 🌐 Live Demo

*(Add after deployment)*
Frontend: https://vectorvisuvaliesr-6.onrender.com/gradient
Backend: https://vectorvisuvaliesr-5.onrender.com

---

## 🧠 Features

* 📈 **Gradient Visualization**

  * Shows direction of maximum increase of a scalar field

* 🔄 **Curl Visualization**

  * Displays rotational behavior of vector fields

* 🌊 **Divergence Visualization**

  * Identifies sources and sinks in a field

* 🎨 **Interactive Canvas**

  * Dynamic vector rendering with arrows and scaling

* ⚡ **Real-time Computation**

  * Backend computes vector field instantly

* 🧪 **Custom Input Support**

  * Users can input functions like:

    * `x^2 + y^2`
    * `sin(x) + cos(y)`

---

## 🏗️ Tech Stack

### Frontend

* React
* React Router
* HTML5 Canvas
* Parcel (bundler)

### Backend

* Node.js
* Express.js

---

## 📂 Project Structure

```
VECTOR/
├── client/              # Frontend (React)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── index.jsx
│   │   └── styles.css
│   └── package.json
│
├── server.js            # Backend server
├── package.json         # Backend dependencies
```

---

## ⚙️ Installation & Setup

### 1. Clone the repo

```
git clone <your-repo-url>
cd VECTOR
```

---

### 2. Install dependencies

#### Backend

```
npm install
```

#### Frontend

```
cd client
npm install
```

---

### 3. Run the app

#### Start backend

```
node server.js
```

#### Start frontend

```
cd client
npm start
```

---

## 🌍 API Endpoints

```
POST /api/gradient
POST /api/curl
POST /api/divergence
GET  /api/functions
```

---

## 📊 How It Works

1. User selects a function or inputs custom expression
2. Frontend sends request to backend API
3. Backend computes vector field data
4. Data is returned as `{x, y, vx, vy}`
5. Canvas renders vectors dynamically

---

## 🎯 Future Improvements

* Add animations to vector fields
* 3D visualization
* More mathematical functions
* Performance optimization

---

## 👨‍💻 Author

Harsha Vardhan

---

## ⭐ Acknowledgements

Inspired by vector calculus concepts and interactive visualization tools.
