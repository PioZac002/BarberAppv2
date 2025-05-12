import { Drawer } from "vaul";

const DrawerComponent = () => (
    <Drawer>
        <Drawer.Overlay />
        <Drawer.Content>
            <Drawer.Title>Drawer Title</Drawer.Title>
            <Drawer.Description>Drawer Description</Drawer.Description>
            {/* Your drawer content */}
        </Drawer.Content>
    </Drawer>
);

export default DrawerComponent;