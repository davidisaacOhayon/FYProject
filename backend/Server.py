from fastapi import FastAPI


app = FastAPI()





@app.get("/Test")
async def test_Endpoint():
    return({"message":"wsg gng"})