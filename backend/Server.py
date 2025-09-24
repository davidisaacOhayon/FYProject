from fastapi import FastAPI


app = FastAPI()


@app.get("/Test")
def test_Endpoint():
    return({"message":"wsg gng"})